// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useForm, Controller } from 'react-hook-form';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Stepper, Step, StepLabel, Chip } from '@mui/material';
// import ItemCard from './ItemCard'; // Reused from April 11, 2025
// import { fetchFilteredEntities, fetchCircuitTemplates, composeCircuit, fetchDestinations } from '../redux/actions/circuitActions';
// import { savePreference } from '../redux/actions/userActions';

// const steps = ['Préférences', 'Destinations', 'Jours', 'Entités', 'Revue'];

// const CircuitComposer = () => {
//   const dispatch = useDispatch();
//   const { entities, templates, destinations, loading, error, circuitId } = useSelector((state) => state.circuit);
//   const { userId, preference } = useSelector((state) => state.auth);
//   const { control, handleSubmit, watch, setValue } = useForm();
//   const [activeStep, setActiveStep] = useState(0);
//   const [selectedDestinations, setSelectedDestinations] = useState([]);
//   const [destinationDays, setDestinationDays] = useState({});
//   const [stops, setStops] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const tripDays = preference?.departure_date && preference?.arrival_date
//     ? Math.ceil((new Date(preference.arrival_date) - new Date(preference.departure_date)) / (1000 * 60 * 60 * 24)) + 1
//     : 0;

//   useEffect(() => {
//     dispatch(fetchDestinations());
//     if (userId) {
//       dispatch(fetchFilteredEntities(userId));
//       dispatch(fetchCircuitTemplates(userId));
//     }
//   }, [dispatch, userId]);

//   // Load template
//   const loadTemplate = (template) => {
//     setSelectedTemplate(template);
//     setSelectedDestinations(template.destinations.map(d => d.destination_id));
//     setDestinationDays(template.destinations.reduce((acc, d) => ({ ...acc, [d.destination_id]: d.days }), {}));
//     setStops(template.stops);
//     setActiveStep(3); // Jump to Entities step
//   };

//   // Handle destination selection
//   const handleDestinationToggle = (destId) => {
//     if (selectedDestinations.includes(destId)) {
//       setSelectedDestinations(selectedDestinations.filter(id => id !== destId));
//       const newDays = { ...destinationDays };
//       delete newDays[destId];
//       setDestinationDays(newDays);
//     } else if (selectedDestinations.length < tripDays) {
//       setSelectedDestinations([...selectedDestinations, destId]);
//       setDestinationDays({ ...destinationDays, [destId]: 1 });
//     }
//   };

//   // Handle days assignment
//   const handleDaysChange = (destId, days) => {
//     const totalAssigned = Object.values({ ...destinationDays, [destId]: days }).reduce((sum, d) => sum + d, 0);
//     if (totalAssigned <= tripDays) {
//       setDestinationDays({ ...destinationDays, [destId]: days });
//     }
//   };

//   // Add stop
//   const addStop = (entityType, entityId, destinationId, day) => {
//     setStops([...stops, { [entityType]: entityId, destination_id: destinationId, day }]);
//   };

//   // Drag-and-drop handler
//   const onDragEnd = (result) => {
//     if (!result.destination) return;
//     const reorderedStops = Array.from(stops);
//     const [moved] = reorderedStops.splice(result.source.index, 1);
//     reorderedStops.splice(result.destination.index, 0, moved);
//     setStops(reorderedStops);
//   };

//   // Submit circuit
//   const onSubmit = () => {
//     const circuitData = {
//       name: watch('name') || 'Circuit Personnalisé',
//       departure_city_id: watch('departure_city_id'),
//       arrival_city_id: watch('arrival_city_id'),
//       destinations: selectedDestinations.map(id => ({
//         destination_id: id,
//         days: destinationDays[id] || 1
//       })),
//       stops,
//       description: watch('description')
//     };
//     dispatch(composeCircuit(circuitData));
//   };

//   // Save preferences
//   const onSavePreferences = (data) => {
//     dispatch(savePreference({ ...data, user_id: userId }));
//     setActiveStep(1);
//   };

//   // Next/Back navigation
//   const handleNext = () => {
//     if (activeStep === 2) {
//       const totalDays = Object.values(destinationDays).reduce((sum, d) => sum + d, 0);
//       if (totalDays > tripDays) {
//         alert(`Total des jours (${totalDays}) dépasse la durée du voyage (${tripDays})`);
//         return;
//       }
//     }
//     setActiveStep(prev => prev + 1);
//   };

//   const handleBack = () => setActiveStep(prev => prev - 1);

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>Composez Votre Circuit</Typography>
//       <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
//         {steps.map(label => (
//           <Step key={label}>
//             <StepLabel>{label}</StepLabel>
//           </Step>
//         ))}
//       </Stepper>

//       {/* Step 0: Préférences */}
//       {activeStep === 0 && (
//         <Box component="form" onSubmit={handleSubmit(onSavePreferences)} sx={{ mt: 2 }}>
//           <Grid container spacing={2}>
//             <Grid item xs={6}>
//               <Controller
//                 name="budget"
//                 control={control}
//                 defaultValue={preference?.budget || 0}
//                 render={({ field }) => (
//                   <TextField {...field} type="number" label="Budget (TND)" fullWidth required />
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="accommodation"
//                 control={control}
//                 defaultValue={preference?.accommodation || 'hôtel'}
//                 render={({ field }) => (
//                   <FormControl fullWidth>
//                     <InputLabel>Hébergement</InputLabel>
//                     <Select {...field} label="Hébergement" required>
//                       <MenuItem value="hôtel">Hôtel</MenuItem>
//                       <MenuItem value="maison d'hôte">Maison d'hôte</MenuItem>
//                     </Select>
//                   </FormControl>
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="stars"
//                 control={control}
//                 defaultValue={preference?.stars || 1}
//                 render={({ field }) => (
//                   <TextField {...field} type="number" label="Étoiles Hôtel (1-5)" fullWidth InputProps={{ min: 1, max: 5 }} />
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="guest_house_category"
//                 control={control}
//                 defaultValue={preference?.guest_house_category || 'Standard'}
//                 render={({ field }) => (
//                   <FormControl fullWidth>
//                     <InputLabel>Catégorie Maison d'Hôte</InputLabel>
//                     <Select {...field} label="Catégorie Maison d'Hôte">
//                       <MenuItem value="Luxe">Luxe</MenuItem>
//                       <MenuItem value="Moyenne gamme">Moyenne gamme</MenuItem>
//                       <MenuItem value="Économie">Économie</MenuItem>
//                     </Select>
//                   </FormControl>
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="departure_city_id"
//                 control={control}
//                 defaultValue={preference?.departure_city_id || ''}
//                 render={({ field }) => (
//                   <FormControl fullWidth>
//                     <InputLabel>Ville de Départ</InputLabel>
//                     <Select {...field} label="Ville de Départ" required>
//                       {destinations?.map(dest => (
//                         <MenuItem key={dest.id} value={dest.id}>{dest.name}</MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="arrival_city_id"
//                 control={control}
//                 defaultValue={preference?.arrival_city_id || ''}
//                 render={({ field }) => (
//                   <FormControl fullWidth>
//                     <InputLabel>Ville d'Arrivée</InputLabel>
//                     <Select {...field} label="Ville d'Arrivée" required>
//                       {destinations?.map(dest => (
//                         <MenuItem key={dest.id} value={dest.id}>{dest.name}</MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="departure_date"
//                 control={control}
//                 defaultValue={preference?.departure_date || ''}
//                 render={({ field }) => (
//                   <TextField {...field} type="date" label="Date de Départ" fullWidth required InputLabelProps={{ shrink: true }} />
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="arrival_date"
//                 control={control}
//                 defaultValue={preference?.arrival_date || ''}
//                 render={({ field }) => (
//                   <TextField {...field} type="date" label="Date d'Arrivée" fullWidth required InputLabelProps={{ shrink: true }} />
//                 )}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <Controller
//                 name="forks"
//                 control={control}
//                 defaultValue={preference?.forks || 1}
//                 render={({ field }) => (
//                   <TextField {...field} type="number" label="Fourchettes Restaurant (1-3)" fullWidth InputProps={{ min: 1, max: 3 }} required />
//                 )}
//               />
//             </Grid>
//           </Grid>
//           <Button type="submit" variant="contained" sx={{ mt: 2 }}>Enregistrer Préférences</Button>
//         </Box>
//       )}

//       {/* Step 1: Destinations */}
//       {activeStep === 1 && (
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="h6">Sélectionnez les Destinations (Max: {tripDays})</Typography>
//           <Grid container spacing={2}>
//             {destinations?.map(dest => (
//               <Grid item xs={4} key={dest.id}>
//                 <Chip
//                   label={dest.name}
//                   color={selectedDestinations.includes(dest.id) ? 'primary' : 'default'}
//                   onClick={() => handleDestinationToggle(dest.id)}
//                   disabled={selectedDestinations.length >= tripDays && !selectedDestinations.includes(dest.id)}
//                 />
//               </Grid>
//             ))}
//           </Grid>
//           <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }} disabled={selectedDestinations.length === 0}>
//             Suivant
//           </Button>
//         </Box>
//       )}

//       {/* Step 2: Jours */}
//       {activeStep === 2 && (
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="h6">Attribuez les Jours (Total: {tripDays})</Typography>
//           {selectedDestinations.map(destId => {
//             const dest = destinations.find(d => d.id === destId);
//             return (
//               <Grid container spacing={2} key={destId} sx={{ mb: 2 }}>
//                 <Grid item xs={6}>
//                   <Typography>{dest?.name}</Typography>
//                 </Grid>
//                 <Grid item xs={6}>
//                   <TextField
//                     type="number"
//                     label="Jours"
//                     value={destinationDays[destId] || 1}
//                     onChange={e => handleDaysChange(destId, parseInt(e.target.value) || 1)}
//                     InputProps={{ min: 1, max: tripDays }}
//                     fullWidth
//                   />
//                 </Grid>
//               </Grid>
//             );
//           })}
//           <Typography>Total des Jours Attribués: {Object.values(destinationDays).reduce((sum, d) => sum + d, 0)}</Typography>
//           <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
//           <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }}>Suivant</Button>
//         </Box>
//       )}

//       {/* Step 3: Entités */}
//       {activeStep === 3 && (
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="h6">Sélectionnez les Entités pour Chaque Jour</Typography>
//           {selectedDestinations.map(destId => {
//             const dest = destinations.find(d => d.id === destId);
//             const days = destinationDays[destId] || 1;
//             return (
//               <Box key={destId} sx={{ mb: 3 }}>
//                 <Typography variant="h6">{dest?.name} ({days} jours)</Typography>
//                 {[...Array(days)].map((_, index) => (
//                   <Box key={index} sx={{ ml: 2, mb: 2 }}>
//                     <Typography>Jour {index + 1}</Typography>
//                     {['hotels', 'guest_houses', 'activities', 'restaurants', 'museums', 'festivals', 'archaeological_sites'].map(type => (
//                       entities[type]?.some(e => e.destination__id === destId) && (
//                         <FormControl fullWidth sx={{ mt: 1 }} key={type}>
//                           <InputLabel>{type.replace('_', ' ').replace('hotels', 'Hôtels').replace('guest_houses', 'Maisons d\'hôte').replace('activities', 'Activités').replace('restaurants', 'Restaurants').replace('museums', 'Musées').replace('festivals', 'Festivals').replace('archaeological_sites', 'Sites Archéologiques')}</InputLabel>
//                           <Select
//                             onChange={e => addStop(`${type.slice(0, -1)}_id`, e.target.value, destId, index + 1)}
//                           >
//                             {entities[type].filter(e => e.destination__id === destId).map(item => (
//                               <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
//                             ))}
//                           </Select>
//                         </FormControl>
//                       )
//                     ))}
//                   </Box>
//                 ))}
//               </Box>
//             );
//           })}
//           <Typography variant="h6" sx={{ mt: 2 }}>Modèles</Typography>
//           <Grid container spacing={2}>
//             {templates.map((template, index) => (
//               <Grid item xs={12} sm={6} key={index}>
//                 <ItemCard
//                   item={{
//                     name: template.name,
//                     description: `Durée: ${template.duration} jours, Prix: ${template.price}`,
//                     onClick: () => loadTemplate(template)
//                   }}
//                 />
//               </Grid>
//             ))}
//           </Grid>
//           <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
//           <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }} disabled={stops.length === 0}>
//             Suivant
//           </Button>
//         </Box>
//       )}

//       {/* Step 4: Revue */}
//       {activeStep === 4 && (
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="h6">Prévisualisez Votre Circuit</Typography>
//           <TextField
//             label="Nom du Circuit"
//             fullWidth
//             sx={{ mb: 2 }}
//             onChange={e => setValue('name', e.target.value)}
//             defaultValue={selectedTemplate?.name || 'Circuit Personnalisé'}
//           />
//           <DragDropContext onDragEnd={onDragEnd}>
//             <Droppable droppableId="review">
//               {(provided) => (
//                 <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ minHeight: 200 }}>
//                   {stops.map((stop, index) => (
//                     <Draggable key={index} draggableId={`stop-${index}`} index={index}>
//                       {(provided) => (
//                         <Box
//                           ref={provided.innerRef}
//                           {...provided.draggableProps}
//                           {...provided.dragHandleProps}
//                           sx={{ p: 1, mb: 1, bgcolor: 'grey.100' }}
//                         >
//                           {Object.keys(stop).map(key => (
//                             key !== 'destination_id' && key !== 'day' && (
//                               <ItemCard
//                                 key={key}
//                                 item={entities[key.replace('_id', 's')]?.find(item => item.id === stop[key])}
//                               />
//                             )
//                           ))}
//                           <Typography>Jour: {stop.day}, Destination: {destinations.find(d => d.id === stop.destination_id)?.name}</Typography>
//                         </Box>
//                       )}
//                     </Draggable>
//                   ))}
//                   {provided.placeholder}
//                 </Box>
//               )}
//             </Droppable>
//           </DragDropContext>
//           <Button variant="contained" onClick={handleBack} sx={{ mt: 2, mr: 1 }}>Retour</Button>
//           <Button variant="contained" onClick={onSubmit} sx={{ mt: 2 }}>Enregistrer</Button>
//         </Box>
//       )}

//       {error && <Typography color="error">{error}</Typography>}
//       {loading && <Typography>Chargement...</Typography>}
//       {circuitId && <Typography color="success">Circuit enregistré avec ID: {circuitId}</Typography>}
//     </Box>
//   );
// };

// export default CircuitComposer;