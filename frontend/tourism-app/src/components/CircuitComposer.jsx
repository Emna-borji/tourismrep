import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Stepper, Step, StepLabel, Chip } from '@mui/material';
import ItemCard from './ItemCard';
import { fetchFilteredEntities, fetchSuggestedPlaces, saveCircuit } from '../redux/actions/circuitActions';
import { fetchDestinations } from '../redux/actions/destinationActions';
import { fetchActivityCategories, fetchCuisines } from '../redux/actions/preferenceActions';

const steps = ['Préférences', 'Destinations', 'Jours', 'Entités', 'Revue'];

const CircuitComposer = () => {
  const dispatch = useDispatch();
  const { entities, suggestions, loading, error, circuitId } = useSelector((state) => state.circuit);
  const { destinations, loading: destLoading, error: destError } = useSelector((state) => state.destinations);
  const { userInfo } = useSelector((state) => state.auth);
  const { activityCategories, cuisines, activityCategoriesLoading, cuisinesLoading } = useSelector((state) => state.preference);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      budget: 0,
      accommodation: 'hôtel',
      stars: 1,
      guest_house_category: 'Standard',
      departure_city_id: '',
      arrival_city_id: '',
      departure_date: '',
      arrival_date: '',
      forks: 1,
      activity_category_id: '',
      cuisine_id: '',
    }
  });
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [destinationDays, setDestinationDays] = useState({});
  const [selectedPlaces, setSelectedPlaces] = useState([]); // Store user-selected places
  const [preferences, setPreferences] = useState(null);

  const tripDays = preferences?.departure_date && preferences?.arrival_date
    ? Math.ceil((new Date(preferences.arrival_date) - new Date(preferences.departure_date)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  useEffect(() => {
    dispatch(fetchDestinations());
    dispatch(fetchActivityCategories());
    dispatch(fetchCuisines());
  }, [dispatch]);

  useEffect(() => {
    if (preferences && userInfo?.id && selectedDestinations.length > 0) {
      console.log('Fetching suggestions with preferences:', { ...preferences, destination_ids: selectedDestinations });
      dispatch(fetchSuggestedPlaces({ ...preferences, destination_ids: selectedDestinations }));
      dispatch(fetchFilteredEntities(preferences));
    }
  }, [dispatch, preferences, userInfo, selectedDestinations]);

  // Select a place
  const selectPlace = (place, type) => {
    console.log('Selected place:', place, 'Type:', type);
    setSelectedPlaces([...selectedPlaces, { ...place, type }]);
  };

  // Generate circuit from selected places
  const generateCircuit = () => {
    const stops = [];
    let currentDay = 1;
    selectedDestinations.forEach(destId => {
      const days = destinationDays[destId] || 1;
      const placesForDest = selectedPlaces.filter(p => p.destination_id === destId);
      placesForDest.forEach((place, index) => {
        const day = currentDay + Math.floor(index / 2);
        if (day <= days) {
          stops.push({
            destination_id: destId,
            day,
            [`${place.type.slice(0, -1)}_id`]: place.id
          });
        }
      });
      currentDay += days;
    });

    const circuit = {
      name: 'Circuit Personnalisé',
      departure_city_id: preferences.departure_city_id,
      arrival_city_id: preferences.arrival_city_id,
      duration: tripDays,
      price: selectedPlaces.reduce((sum, p) => sum + p.price, 0),
      destinations: selectedDestinations.map(id => ({
        destination_id: id,
        days: destinationDays[id] || 1
      })),
      stops
    };

    console.log('Generated circuit:', circuit);
    setSelectedPlaces([]); // Clear selections
    setSelectedDestinations(circuit.destinations.map(d => d.destination_id));
    setDestinationDays(circuit.destinations.reduce((acc, d) => ({ ...acc, [d.destination_id]: d.days }), {}));
    setSelectedPlaces(circuit.stops.map(s => {
      const type = Object.keys(s).find(k => k.endsWith('_id')).replace('_id', 's');
      const entity = suggestions[type]?.find(e => e.id === s[`${type.slice(0, -1)}_id`]) || {};
      return { ...entity, type };
    }));
    setActiveStep(4); // Move to Revue
  };

  // Handle drag-and-drop reordering
  const onDragEnd = (result) => {
    if (!result.destination) return; // Dropped outside the list

    const reorderedPlaces = Array.from(selectedPlaces);
    const [movedPlace] = reorderedPlaces.splice(result.source.index, 1);
    reorderedPlaces.splice(result.destination.index, 0, movedPlace);

    console.log('Reordered places:', reorderedPlaces); // Debug
    setSelectedPlaces(reorderedPlaces);
  };

  // Handle destination selection
  const handleDestinationToggle = (destId) => {
    if (selectedDestinations.includes(destId)) {
      setSelectedDestinations(selectedDestinations.filter(id => id !== destId));
      const newDays = { ...destinationDays };
      delete newDays[destId];
      setDestinationDays(newDays);
    } else if (selectedDestinations.length < tripDays) {
      setSelectedDestinations([...selectedDestinations, destId]);
      setDestinationDays({ ...destinationDays, [destId]: 1 });
    }
  };

  // Handle days assignment
  const handleDaysChange = (destId, days) => {
    const totalAssigned = Object.values({ ...destinationDays, [destId]: days }).reduce((sum, d) => sum + d, 0);
    if (totalAssigned <= tripDays) {
      setDestinationDays({ ...destinationDays, [destId]: days });
    }
  };

  // Submit circuit
  const onSubmit = () => {
    const circuitData = {
      name: watch('name') || 'Circuit Personnalisé',
      departure_city_id: watch('departure_city_id'),
      arrival_city_id: watch('arrival_city_id'),
      destinations: selectedDestinations.map(id => ({
        destination_id: id,
        days: destinationDays[id] || 1
      })),
      stops: selectedPlaces.map(p => ({
        destination_id: p.destination_id,
        day: p.day || 1,
        [`${p.type.slice(0, -1)}_id`]: p.id
      })),
      description: watch('description'),
      preferences,
      save_preference: true
    };
    dispatch(saveCircuit(circuitData));
  };

  // Save preferences locally
  const onSavePreferences = (data) => {
    if (!userInfo?.id) {
      alert('Utilisateur non connecté. Veuillez vous connecter.');
      return;
    }
    const parsedData = {
      budget: parseFloat(data.budget),
      accommodation: data.accommodation,
      stars: parseInt(data.stars) || null,
      guest_house_category: data.guest_house_category || null,
      departure_city_id: parseInt(data.departure_city_id),
      arrival_city_id: parseInt(data.arrival_city_id),
      departure_date: new Date(data.departure_date).toISOString().split('T')[0],
      arrival_date: new Date(data.arrival_date).toISOString().split('T')[0],
      forks: parseInt(data.forks),
      activity_category_id: parseInt(data.activity_category_id),
      cuisine_id: parseInt(data.cuisine_id),
    };
    setPreferences(parsedData);
    setActiveStep(1);
  };

  // Next/Back navigation
  const handleNext = () => {
    if (activeStep === 2) {
      const totalDays = Object.values(destinationDays).reduce((sum, d) => sum + d, 0);
      if (totalDays > tripDays) {
        alert(`Total des jours (${totalDays}) dépasse la durée du voyage (${tripDays})`);
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  console.log("Suggestions:", suggestions);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Composez Votre Circuit</Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Préférences */}
      {activeStep === 0 && (
        <Box component="form" onSubmit={handleSubmit(onSavePreferences)} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller
                name="budget"
                control={control}
                rules={{ required: 'Budget requis', min: { value: 0, message: 'Budget doit être positif' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Budget (TND)"
                    fullWidth
                    error={!!errors.budget}
                    helperText={errors.budget?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="accommodation"
                control={control}
                rules={{ required: 'Hébergement requis' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.accommodation}>
                    <InputLabel>Hébergement</InputLabel>
                    <Select {...field} label="Hébergement" required>
                      <MenuItem value="hôtel">Hôtel</MenuItem>
                      <MenuItem value="maison d'hôte">Maison d'hôte</MenuItem>
                    </Select>
                    {errors.accommodation && <Typography color="error">{errors.accommodation.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="stars"
                control={control}
                rules={{ min: { value: 1, message: 'Minimum 1 étoile' }, max: { value: 5, message: 'Maximum 5 étoiles' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Étoiles Hôtel (1-5)"
                    fullWidth
                    error={!!errors.stars}
                    helperText={errors.stars?.message}
                    InputProps={{ min: 1, max: 5 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="guest_house_category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Catégorie Maison d'Hôte</InputLabel>
                    <Select {...field} label="Catégorie Maison d'Hôte">
                      <MenuItem value="Luxe">Luxe</MenuItem>
                      <MenuItem value="Moyenne gamme">Moyenne gamme</MenuItem>
                      <MenuItem value="Économie">Économie</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="departure_city_id"
                control={control}
                rules={{ required: 'Ville de départ requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.departure_city_id}>
                    <InputLabel>Ville de Départ</InputLabel>
                    <Select {...field} label="Ville de Départ" required>
                      {destinations?.map(dest => (
                        <MenuItem key={dest.id} value={dest.id}>{dest.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.departure_city_id && <Typography color="error">{errors.departure_city_id.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="arrival_city_id"
                control={control}
                rules={{ required: 'Ville d’arrivée requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.arrival_city_id}>
                    <InputLabel>Ville d'Arrivée</InputLabel>
                    <Select {...field} label="Ville d'Arrivée" required>
                      {destinations?.map(dest => (
                        <MenuItem key={dest.id} value={dest.id}>{dest.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.arrival_city_id && <Typography color="error">{errors.arrival_city_id.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="departure_date"
                control={control}
                rules={{ required: 'Date de départ requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Date de Départ"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.departure_date}
                    helperText={errors.departure_date?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="arrival_date"
                control={control}
                rules={{ required: 'Date d’arrivée requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Date d'Arrivée"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.arrival_date}
                    helperText={errors.arrival_date?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="forks"
                control={control}
                rules={{ required: 'Fourchettes requises', min: { value: 1, message: 'Minimum 1 fourchette' }, max: { value: 3, message: 'Maximum 3 fourchettes' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Fourchettes Restaurant (1-3)"
                    fullWidth
                    error={!!errors.forks}
                    helperText={errors.forks?.message}
                    InputProps={{ min: 1, max: 3 }}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="activity_category_id"
                control={control}
                rules={{ required: 'Catégorie d’activité requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.activity_category_id}>
                    <InputLabel>Catégorie d’Activité</InputLabel>
                    <Select {...field} label="Catégorie d’Activité" required disabled={activityCategoriesLoading}>
                      {activityCategories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.activity_category_id && <Typography color="error">{errors.activity_category_id.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="cuisine_id"
                control={control}
                rules={{ required: 'Cuisine requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.cuisine_id}>
                    <InputLabel>Cuisine</InputLabel>
                    <Select {...field} label="Cuisine" required disabled={cuisinesLoading}>
                      {cuisines.map(cuisine => (
                        <MenuItem key={cuisine.id} value={cuisine.id}>{cuisine.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.cuisine_id && <Typography color="error">{errors.cuisine_id.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={activityCategoriesLoading || cuisinesLoading}>
            Continuer
          </Button>
          {error && <Typography color="error" sx={{ mt: 2 }}>{typeof error === 'object' ? JSON.stringify(error) : error}</Typography>}
        </Box>
      )}

      {/* Step 1: Destinations */}
      {activeStep === 1 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Sélectionnez les Destinations (Max: {tripDays})</Typography>
          {destLoading && <Typography>Chargement des destinations...</Typography>}
          {destError && <Typography color="error">{destError}</Typography>}
          <Grid container spacing={2}>
            {destinations?.map(dest => (
              <Grid item xs={4} key={dest.id}>
                <Chip
                  label={dest.name}
                  color={selectedDestinations.includes(dest.id) ? 'primary' : 'default'}
                  onClick={() => handleDestinationToggle(dest.id)}
                  disabled={selectedDestinations.length >= tripDays && !selectedDestinations.includes(dest.id)}
                />
              </Grid>
            ))}
          </Grid>
          <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }} disabled={selectedDestinations.length === 0 || destLoading}>
            Suivant
          </Button>
        </Box>
      )}

      {/* Step 2: Jours */}
      {activeStep == 2 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Attribuez les Jours (Total: {tripDays})</Typography>
          {selectedDestinations.map(destId => {
            const dest = destinations.find(d => d.id === destId);
            return (
              <Grid container spacing={2} key={destId} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography>{dest?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    type="number"
                    label="Jours"
                    value={destinationDays[destId] || 1}
                    onChange={e => handleDaysChange(destId, parseInt(e.target.value) || 1)}
                    InputProps={{ min: 1, max: tripDays }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            );
          })}
          <Typography>Total des Jours Attribués: {Object.values(destinationDays).reduce((sum, d) => sum + d, 0)}</Typography>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
          <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }}>Suivant</Button>
        </Box>
      )}

      {/* Step 3: Entités */}
      {activeStep === 3 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Choisissez Vos Lieux</Typography>
          {selectedDestinations.map(destId => {
            const dest = destinations.find(d => d.id === destId);
            return (
              <Box key={destId} sx={{ mb: 3 }}>
                <Typography variant="h6">{dest?.name}</Typography>
                {['hotels', 'activities', 'museums'].map(type => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {type.replace('hotels', 'Hôtels').replace('activities', 'Activités').replace('museums', 'Musées')}
                    </Typography>
                    <Grid container spacing={2}>
                      {suggestions[type]?.filter(e => e.destination_id === destId).map((place, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <ItemCard
                            item={{
                              name: place.name,
                              description: `Prix: ${place.price} TND`,
                              price: place.price,
                              stars: place.stars,
                              category_id: place.category_id
                            }}
                            onClick={() => selectPlace(place, type)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Box>
            );
          })}
          <Button
            variant="contained"
            onClick={generateCircuit}
            sx={{ mt: 2 }}
            disabled={selectedPlaces.length === 0}
          >
            Générer le Circuit
          </Button>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ mt: 2 }}
            disabled={selectedPlaces.length === 0}
          >
            Suivant
          </Button>
        </Box>
      )}

      {/* Step 4: Revue */}
      {activeStep === 4 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Prévisualisez Votre Circuit</Typography>
          <TextField
            label="Nom du Circuit"
            fullWidth
            sx={{ mb: 2 }}
            onChange={e => setValue('name', e.target.value)}
            defaultValue="Circuit Personnalisé"
          />
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="review">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ minHeight: 200 }}>
                  {selectedPlaces.map((place, index) => (
                    <Draggable key={index} draggableId={`place-${index}`} index={index}>
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ p: 1, mb: 1, bgcolor: 'grey.100' }}
                        >
                          <ItemCard
                            item={{
                              name: place.name,
                              description: `Prix: ${place.price} TND`,
                              price: place.price,
                              stars: place.stars,
                              category_id: place.category_id
                            }}
                          />
                          <Typography>
                            Jour: {place.day || 1}, Destination: {destinations.find(d => d.id === place.destination_id)?.name}
                          </Typography>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
          <Button variant="contained" onClick={onSubmit} sx={{ mt: 2 }}>Enregistrer</Button>
        </Box>
      )}

      {error && <Typography color="error">{error}</Typography>}
      {loading && <Typography>Chargement...</Typography>}
      {circuitId && <Typography color="success">Circuit enregistré avec ID: {circuitId}</Typography>}
    </Box>
  );
};

export default CircuitComposer;