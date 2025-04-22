import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDestinations } from '../redux/actions/destinationActions';
import { fetchCuisines, fetchActivityCategories, savePreference } from '../redux/actions/preferenceActions';
import { fetchEntities, clearEntities } from '../redux/actions/entityActions';
import axios from '../api/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { store } from '../redux/store';
import './circuitWizard.css';

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Step 3 Component
const Step3 = ({ formData, setFormData, destinations }) => {
  const { circuitEntities = [] } = useSelector((state) => state.entities || {});

  const selectEntity = (destId, day, entityType, entity) => {
    if (!destId || !day || !entityType) {
      console.error('Invalid parameters in selectEntity:', { destId, day, entityType, entity });
      return;
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        selectedEntities: {
          ...prev.selectedEntities,
          [destId]: {
            ...prev.selectedEntities[destId],
            [day]: {
              ...prev.selectedEntities[destId]?.[day],
              [entityType]: entity,
            },
          },
        },
      };
      console.log(`Selected entity for ${destId} on Day ${day}:`, { entityType, entity });
      console.log('Updated selectedEntities after selection:', updated.selectedEntities);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Select Entities</h2>
      {formData.destinations.map(dest => (
        <div key={dest.id} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">{dest.name}</h3>
          {Array.from({ length: dest.days }, (_, i) => i + 1).map(day => (
            <div key={day} className="ml-4 mt-4">
              <h4 className="text-lg font-medium">Day {day}</h4>
              {['hotel', 'guest_house', 'restaurant', 'activity', 'museum', 'festival', 'archaeological_site'].map(entityType => {
                if (entityType === 'hotel' && formData.accommodation !== 'hôtel') return null;
                if (entityType === 'guest_house' && formData.accommodation !== "maison d'hôte") return null;

                const suggestions = circuitEntities
                  .filter(e => {
                    const matchesType = e.entityType === entityType;
                    const matchesDestination = e.destinationId === dest.id;
                    const matchesDay = e.day === day;
                    const matchesDestinationName = Array.isArray(e.data) && e.data.length > 0 && e.data.some(entity => {
                      const entityDestName = typeof entity.destination === 'string' 
                        ? entity.destination.toLowerCase() 
                        : (entity.destination?.name || '').toLowerCase();
                      return entityDestName === dest.name.toLowerCase();
                    });
                    return matchesType && matchesDestination && matchesDay && matchesDestinationName;
                  })
                  .flatMap(e => e.data)
                  .slice(0, 5);

                console.log(`Suggestions for ${entityType} in ${dest.name} (ID: ${dest.id}) on Day ${day}:`, suggestions);

                return (
                  <div key={entityType} className="mt-2">
                    <label className="block text-sm font-medium text-gray-600">
                      {entityType.charAt(0).toUpperCase() + entityType.slice(1).replace('_', ' ')}
                    </label>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No suggestions available for {entityType} in {dest.name} on Day {day}.</p>
                    ) : (entityType === 'hotel' || entityType === 'guest_house') ? (
                      <select
                        onChange={(e) => {
                          const entity = suggestions.find(s => s.id === parseInt(e.target.value));
                          selectEntity(dest.id, day, entityType, entity);
                        }}
                        className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                        value={formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id || ''}
                      >
                        <option value="">Select {entityType.replace('_', ' ')}</option>
                        {suggestions.map(entity => (
                          <option key={entity.id} value={entity.id}>{entity.name}</option>
                        ))}
                      </select>
                    ) : (
                      suggestions.map(entity => (
                        <div key={entity.id} className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id === entity.id}
                            onChange={() => selectEntity(dest.id, day, entityType, entity)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                          />
                          <span className="ml-2 text-gray-700">{entity.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Component to handle map initialization and size invalidation
const MapInitializer = () => {
  const map = useMap();
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (map && !mapInitialized.current) {
      const timeout = setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
        mapInitialized.current = true;
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [map]);

  return null;
};

// Component to handle routing with Leaflet Routing Machine
const RoutingMachine = ({ waypoints }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) {
      console.log('RoutingMachine: Not enough waypoints to create a route.', waypoints);
      return;
    }

    const initializeRouting = () => {
      map.eachLayer(layer => {
        if (layer instanceof L.Routing.Control || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const routingControl = L.Routing.control({
        waypoints: waypoints.map((point, index) => {
          const latLng = L.latLng(point.lat, point.lng);
          console.log(`Waypoint ${index + 1}: ${point.name} at [${point.lat}, ${point.lng}]`);
          return latLng;
        }),
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
        }),
        routeWhileDragging: false,
        lineOptions: {
          styles: [{ color: '#1E90FF', weight: 5, opacity: 0.7 }],
        },
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        console.log('Route calculated:', routes);
        if (routes.length > 0) {
          const summary = routes[0].summary;
          console.log(`Total distance: ${(summary.totalDistance / 1000).toFixed(2)} km`);
          console.log(`Total time: ${(summary.totalTime / 3600).toFixed(2)} hours`);

          const routeCoordinates = routes[0].coordinates.map(coord => [coord.lat, coord.lng]);
          console.log('Route coordinates (first 5):', routeCoordinates.slice(0, 5));

          const routeLayer = L.polyline(routeCoordinates, {
            color: '#1E90FF',
            weight: 5,
            opacity: 0.7,
          }).addTo(map);
          console.log('Route layer manually added to map:', routeLayer);

          const bounds = L.latLngBounds(routeCoordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
          console.log('Map bounds adjusted to fit route');

          const fallbackLine = L.polyline(waypoints.map(point => [point.lat, point.lng]), {
            color: 'red',
            weight: 3,
            opacity: 0.5,
            dashArray: '5, 10',
          }).addTo(map);
          console.log('Fallback straight line added (red dashed):', fallbackLine);
        }
      });

      routingControl.on('routingerror', (e) => {
        console.error('Routing error:', e.error);
      });

      routingControlRef.current = routingControl;
    };

    const timer = setTimeout(() => {
      initializeRouting();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, waypoints]);

  return null;
};

const CircuitWizard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { destinations = [], loading: destinationsLoading = false, error: destinationError = null } = useSelector((state) => state.destinations || {});
  const { cuisines = [], activityCategories = [] } = useSelector((state) => state.preference || {});
  const { userInfo = {} } = useSelector((state) => state.auth || {});
  const { error: entitiesError } = useSelector((state) => state.entities || {});

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    budget: '',
    accommodation: 'hôtel',
    stars: '',
    guest_house_category: '',
    forks: '',
    cuisines: [],
    activities: [],
    departure_city: '',
    arrival_city: '',
    departure_date: '',
    arrival_date: '',
    destinations: [],
    selectedEntities: {},
    circuit: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false); // New state to control map visibility

  useEffect(() => {
    dispatch(fetchDestinations());
    dispatch(fetchCuisines());
    dispatch(fetchActivityCategories());
    dispatch(clearEntities());
  }, [dispatch]);

  // Ensure map renders after animation completes
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        setIsMapVisible(true);
        console.log('Map set to visible after animation');
      }, 600); // Slightly longer than animation duration (0.3s + buffer)
      return () => clearTimeout(timer);
    } else {
      setIsMapVisible(false);
    }
  }, [step]);

  const getTotalDays = useCallback(() => {
    if (!formData.departure_date || !formData.arrival_date) return 0;
    const depDate = new Date(formData.departure_date);
    const arrDate = new Date(formData.arrival_date);
    return Math.ceil((arrDate - depDate) / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.departure_date, formData.arrival_date]);

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    if (!formData.budget || formData.budget <= 0) newErrors.budget = 'Budget is required and must be positive';
    if (!formData.stars && formData.accommodation === 'hôtel') newErrors.stars = 'Stars are required for hotels';
    if (!formData.guest_house_category && formData.accommodation === "maison d'hôte") newErrors.guest_house_category = 'Category is required for guest houses';
    if (!formData.forks) newErrors.forks = 'Forks are required';
    if (formData.cuisines.length === 0) newErrors.cuisines = 'Select at least one cuisine';
    if (formData.activities.length === 0) newErrors.activities = 'Select at least one activity category';
    if (!formData.departure_city) newErrors.departure_city = 'Departure city is required';
    if (!formData.arrival_city) newErrors.arrival_city = 'Arrival city is required';
    if (formData.departure_date && formData.arrival_date) {
      const depDate = new Date(formData.departure_date);
      const arrDate = new Date(formData.arrival_date);
      if (depDate >= arrDate) newErrors.dates = 'Arrival date must be after departure date';
    }
    return newErrors;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const totalDays = getTotalDays();
    const selectedDays = formData.destinations.reduce((sum, dest) => sum + (dest.days || 0), 0);
    return {
      isValid: selectedDays === totalDays,
      error: selectedDays !== totalDays ? `Total days (${selectedDays}) must equal trip duration (${totalDays})` : null,
    };
  }, [formData.destinations, getTotalDays]);

  const validateStep3 = useCallback(() => {
    const newErrors = {};
    let hasEntities = false;

    formData.destinations.forEach(dest => {
      for (let day = 1; day <= dest.days; day++) {
        const entities = formData.selectedEntities[dest.id]?.[day] || {};
        const hasEntity = entities.hotel || entities.guest_house || entities.restaurant || entities.activity || entities.museum || entities.festival || entities.archaeological_site;
        console.log(`Checking entities for ${dest.name} (ID: ${dest.id}) on Day ${day}:`, entities);
        if (hasEntity) {
          console.log(`Found entities for ${dest.name} (ID: ${dest.id}) on Day ${day}`);
          hasEntities = true;
        }
      }
    });

    if (!hasEntities) {
      console.log('Validation failed: No entities selected for the trip');
      newErrors.entities = 'Please select at least one entity (e.g., hotel, restaurant, activity) for at least one day in your trip.';
    } else {
      console.log('Step 3 validation passed');
    }

    return newErrors;
  }, [formData.destinations, formData.selectedEntities]);

  if (!userInfo || !userInfo.id) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">Please log in to continue.</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleNext = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (step === 1) {
      const newErrors = validateStep1();
      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        try {
          const preferenceData = {
            user: userInfo.id,
            budget: formData.budget,
            accommodation: formData.accommodation,
            stars: formData.accommodation === 'hôtel' ? formData.stars : null,
            guest_house_category: formData.accommodation === "maison d'hôte" ? formData.guest_house_category : null,
            forks: formData.forks,
            cuisines: formData.cuisines.map(id => ({ cuisine: id })),
            activities: formData.activities.map(id => ({ activity_category: id })),
            departure_city: formData.departure_city,
            arrival_city: formData.arrival_city,
            departure_date: formData.departure_date,
            arrival_date: formData.arrival_date,
          };
          await dispatch(savePreference(preferenceData)).unwrap();
          const departureDest = destinations.find(d => d.id === parseInt(formData.departure_city));
          const arrivalDest = destinations.find(d => d.id === parseInt(formData.arrival_city));
          setFormData(prev => ({
            ...prev,
            destinations: [
              { id: departureDest?.id, name: departureDest?.name, days: 1 },
              { id: arrivalDest?.id, name: arrivalDest?.name, days: 1 },
            ].filter(dest => dest.id),
          }));
          setStep(2);
        } catch (error) {
          setErrors({ api: error.message || 'Failed to save preferences. Please try again.' });
        }
      }
    } else if (step === 2) {
      const { isValid, error } = validateStep2();
      if (isValid) {
        const departureDest = destinations.find(d => d.id === parseInt(formData.departure_city));
        const arrivalDest = destinations.find(d => d.id === parseInt(formData.arrival_city));
        const intermediateDests = formData.destinations.filter(
          dest => dest.id !== departureDest?.id && dest.id !== arrivalDest?.id
        );
        const updatedDestinations = [
          { id: departureDest?.id, name: departureDest?.name, days: formData.destinations.find(d => d.id === departureDest?.id)?.days || 1 },
          ...intermediateDests,
          { id: arrivalDest?.id, name: arrivalDest?.name, days: formData.destinations.find(d => d.id === arrivalDest?.id)?.days || 1 },
        ].filter(dest => dest.id);

        console.log('Updated destinations before Step 3:', updatedDestinations);
        setFormData(prev => ({
          ...prev,
          destinations: updatedDestinations,
        }));

        const entityPromises = [];
        const entityTypes = ['hotel', 'guest_house', 'restaurant', 'activity', 'museum', 'festival', 'archaeological_site'];
        updatedDestinations.forEach(dest => {
          for (let day = 1; day <= dest.days; day++) {
            entityTypes.forEach(entityType => {
              if (entityType === 'hotel' && formData.accommodation !== 'hôtel') return;
              if (entityType === 'guest_house' && formData.accommodation !== "maison d'hôte") return;

              const params = { destination_id: dest.id };
              if (['hotel', 'guest_house'].includes(entityType)) {
                params.stars = formData.stars;
              }
              if (entityType === 'restaurant') {
                params.forks = formData.forks;
                params.cuisine = formData.cuisines.join(',');
              }

              entityPromises.push(
                new Promise((resolve) => {
                  dispatch(fetchEntities(entityType, params))
                    .then(response => {
                      if (Array.isArray(response)) {
                        dispatch({
                          type: 'FETCH_ENTITIES_SUCCESS',
                          payload: {
                            entityType,
                            destinationId: dest.id,
                            day,
                            data: response,
                          },
                        });
                        resolve({ destinationId: dest.id, day, entityType, success: true });
                      } else {
                        resolve({ destinationId: dest.id, day, entityType, success: false, error: 'Invalid response data' });
                      }
                    })
                    .catch(err => {
                      resolve({ destinationId: dest.id, day, entityType, success: false, error: err.message });
                    });
                })
              );
            });
          }
        });

        try {
          const results = await Promise.all(entityPromises);
          const hasErrors = results.some(result => !result.success);
          const state = store.getState();
          const currentEntities = state.entities?.circuitEntities || [];

          if (currentEntities.length === 0) {
            setErrors({ api: 'No entities were fetched. You can proceed, but suggestions will be empty.' });
            setStep(3);
          } else if (hasErrors) {
            setErrors({ api: 'Some entities could not be fetched. You can proceed or try again.' });
            setStep(3);
          } else {
            setStep(3);
          }
        } catch (error) {
          setErrors({ api: 'Failed to fetch entities. Please try again.' });
        }
      } else {
        setErrors({ days: error });
      }
    } else if (step === 3) {
      const step3Errors = validateStep3();
      setErrors(step3Errors);
      if (Object.keys(step3Errors).length > 0) {
        setIsSubmitting(false);
        return;
      }

      try {
        const { auth } = store.getState();
        let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
        if (!token) {
          const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
          if (!localToken) {
            throw new Error('Authentication token is missing. Please log in again.');
          }
          token = localToken;
        }

        const { circuitData, orderedDestinations } = await generateCircuit(auth.userInfo.id);
        console.log('Generated circuitData before API call:', JSON.stringify(circuitData, null, 2));
        console.log('Generated orderedDestinations:', orderedDestinations);

        const requestConfig = {
          url: '/api/itinerary/circuits/',
          method: 'POST',
          data: circuitData,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        console.log('Making API call with config:', requestConfig);

        const response = await axios(requestConfig);
        console.log('API response:', response.data);

        setFormData(prev => {
          const updated = {
            ...prev,
            circuit: { ...circuitData, orderedDestinations, id: response.data.id },
          };
          console.log('Updated formData for Step 4:', updated);
          return updated;
        });
        setStep(4);
      } catch (error) {
        console.error('Error in Step 3:', error);
        console.error('Error response from API:', error.response?.data);
        console.error('Error status:', error.response?.status);
        setErrors({
          api: error.response?.data?.message || error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to generate circuit. Please try again.',
        });
      }
    } else if (step === 4) {
      if (!formData.circuit?.id) {
        setErrors({ api: 'Circuit ID is missing. Please try again.' });
        setIsSubmitting(false);
        return;
      }
      navigate(`/circuit/summary/${formData.circuit.id}`);
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateCircuit = async (userId) => {
    console.log('Generating circuit for user:', userId);
    console.log('Available destinations:', destinations);
    console.log('FormData destinations:', formData.destinations);

    const graph = {};
    destinations.forEach(dest => {
      graph[dest.id] = {};
      destinations.forEach(otherDest => {
        if (dest.id !== otherDest.id) {
          const distance = haversineDistance(
            { lat: dest.latitude, lon: dest.longitude },
            { lat: otherDest.latitude, lon: otherDest.longitude }
          );
          graph[dest.id][otherDest.id] = distance;
        }
      });
    });
    console.log('Distance graph:', graph);

    const departureCityId = parseInt(formData.departure_city);
    const arrivalCityId = parseInt(formData.arrival_city);

    if (isNaN(departureCityId) || isNaN(arrivalCityId)) {
      throw new Error('Departure or arrival city ID is invalid.');
    }

    const intermediateDestIds = formData.destinations
      .filter(dest => dest.id !== departureCityId && dest.id !== arrivalCityId)
      .map(dest => dest.id);

    console.log('Intermediate destination IDs:', intermediateDestIds);

    const visited = new Set();
    const route = [departureCityId];
    visited.add(departureCityId);

    let currentCity = departureCityId;
    while (visited.size < intermediateDestIds.length + 1) {
      let nearestCity = null;
      let minDistance = Infinity;

      for (const destId of intermediateDestIds) {
        if (!visited.has(destId)) {
          const distance = graph[currentCity]?.[destId] || Infinity;
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = destId;
          }
        }
      }

      if (nearestCity === null) break;

      route.push(nearestCity);
      visited.add(nearestCity);
      currentCity = nearestCity;
      console.log(`Added ${destinations.find(d => d.id === nearestCity)?.name} to route. Current route: ${route.map(id => destinations.find(d => d.id === id)?.name).join(' → ')}`);
    }

    route.push(arrivalCityId);
    console.log('Final route:', route.map(id => destinations.find(d => d.id === id)?.name).join(' → '));

    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += graph[route[i]]?.[route[i + 1]] || 0;
    }
    console.log('Total distance:', totalDistance.toFixed(2), 'km');

    const orderedDestinations = [];
    route.forEach(id => {
      const dest = formData.destinations.find(d => d.id === parseInt(id));
      if (dest) {
        orderedDestinations.push(dest);
      }
    });

    console.log('Ordered destinations:', orderedDestinations);

    const expectedDestIds = formData.destinations.map(d => d.id).sort();
    const actualDestIds = orderedDestinations.map(d => d.id).sort();
    if (JSON.stringify(expectedDestIds) !== JSON.stringify(actualDestIds)) {
      console.warn('Not all destinations are included in orderedDestinations:', {
        expected: expectedDestIds,
        actual: actualDestIds,
      });
      throw new Error('Route optimization failed to include all destinations.');
    }

    const duration = getTotalDays();
    if (duration <= 0) {
      throw new Error('Trip duration must be greater than 0.');
    }

    let currentDay = 1;
    const circuitSchedules = [];
    const distances = [];

    for (let i = 0; i < orderedDestinations.length - 1; i++) {
      const fromDest = orderedDestinations[i];
      const toDest = orderedDestinations[i + 1];
      const fromDestFull = destinations.find(d => d.id === fromDest.id);
      const toDestFull = destinations.find(d => d.id === toDest.id);
      const distance = haversineDistance(
        { lat: fromDestFull?.latitude || 0, lon: fromDestFull?.longitude || 0 },
        { lat: toDestFull?.latitude || 0, lon: toDestFull?.longitude || 0 }
      );
      const roundedDistance = Math.min(Number(distance.toFixed(2)), 9999.99);
      console.log(`Distance between ${fromDest.name} and ${toDest.name}: ${distance} km, rounded to ${roundedDistance} km`);
      distances.push(roundedDistance);
    }

    let distanceIndex = 0;
    orderedDestinations.forEach((dest, destIndex) => {
      for (let day = 1; day <= dest.days; day++) {
        const entities = formData.selectedEntities[dest.id]?.[day] || {};
        console.log(`Entities for ${dest.name} (ID: ${dest.id}) on Day ${day}:`, entities);

        let distanceKm = null;
        if (destIndex < distances.length && day === dest.days) {
          distanceKm = distances[distanceIndex];
          distanceIndex++;
        }

        const schedule = {
          destination: parseInt(dest.id),
          order: currentDay,
          day: currentDay,
          distance_km: distanceKm,
          hotel: entities.hotel?.id ? parseInt(entities.hotel.id) : null,
          guest_house: entities.guest_house?.id ? parseInt(entities.guest_house.id) : null,
          restaurant: entities.restaurant?.id ? parseInt(entities.restaurant.id) : null,
          activity: entities.activity?.id ? parseInt(entities.activity.id) : null,
          museum: entities.museum?.id ? parseInt(entities.museum.id) : null,
          festival: entities.festival?.id ? parseInt(entities.festival.id) : null,
          archaeological_site: entities.archaeological_site?.id ? parseInt(entities.archaeological_site.id) : null,
        };

        const hasEntity = schedule.hotel || schedule.guest_house || schedule.restaurant || schedule.activity || schedule.museum || schedule.festival || schedule.archaeological_site;
        if (!hasEntity) {
          console.warn(`Skipping schedule for ${dest.name} (ID: ${dest.id}) on Day ${currentDay} due to no entities selected.`);
          continue;
        }

        console.log(`Schedule for ${dest.name} (ID: ${dest.id}) on Day ${currentDay}:`, schedule);
        circuitSchedules.push(schedule);
        currentDay++;
      }
    });

    if (!circuitSchedules.length) {
      throw new Error('No valid schedules generated. Please ensure at least one day has selected entities.');
    }

    const departureDest = destinations.find(d => d.id === departureCityId);
    const arrivalDest = destinations.find(d => d.id === arrivalCityId);

    const estimatedPrice = formData.budget ? parseFloat(formData.budget) : 1500.00;
    if (estimatedPrice <= 0) {
      throw new Error('Price must be greater than 0.');
    }

    const circuitData = {
      name: `Circuit ${departureDest?.name || formData.departure_city} to ${arrivalDest?.name || formData.arrival_city} ${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      circuit_code: `CIRC${Date.now()}${Math.floor(Math.random() * 1000)}`.toUpperCase(),
      departure_city: departureCityId,
      arrival_city: arrivalCityId,
      price: estimatedPrice,
      duration: duration,
      description: `A journey from ${departureDest?.name || formData.departure_city} to ${arrivalDest?.name || formData.arrival_city} over ${duration} days.`,
      schedules: circuitSchedules,
    };

    return { circuitData, orderedDestinations };
  };

  const haversineDistance = (coord1, coord2) => {
    if (!coord1.lat || !coord1.lon || !coord2.lat || !coord2.lon) {
      console.warn('Missing coordinates, returning 0:', coord1, coord2);
      return 0;
    }
    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.min(Number(distance.toFixed(2)), 9999.99);
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-800">Your Preferences</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Budget (TND)</label>
        <input
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          placeholder="Enter your budget"
        />
        {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Accommodation Type</label>
        <select
          value={formData.accommodation}
          onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          <option value="hôtel">Hôtel</option>
          <option value="maison d'hôte">Maison d’hôte</option>
        </select>
      </div>
      {formData.accommodation === 'hôtel' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Stars</label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.stars}
            onChange={(e) => setFormData({ ...formData, stars: e.target.value })}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="1-5"
          />
          {errors.stars && <p className="text-red-500 text-sm mt-1">{errors.stars}</p>}
        </div>
      )}
      {formData.accommodation === "maison d'hôte" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Guest House Category</label>
          <select
            value={formData.guest_house_category}
            onChange={(e) => setFormData({ ...formData, guest_house_category: e.target.value })}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Category</option>
            <option value="Luxe">Luxe</option>
            <option value="Moyenne gamme">Moyenne gamme</option>
            <option value="Économie">Économie</option>
          </select>
          {errors.guest_house_category && <p className="text-red-500 text-sm mt-1">{errors.guest_house_category}</p>}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Forks (Restaurant Rating)</label>
        <input
          type="number"
          min="1"
          max="3"
          value={formData.forks}
          onChange={(e) => setFormData({ ...formData, forks: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          placeholder="1-3"
        />
        {errors.forks && <p className="text-red-500 text-sm mt-1">{errors.forks}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cuisines</label>
        <select
          multiple
          value={formData.cuisines}
          onChange={(e) => setFormData({ ...formData, cuisines: Array.from(e.target.selectedOptions, option => option.value) })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          {cuisines.map(cuisine => (
            <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
          ))}
        </select>
        {errors.cuisines && <p className="text-red-500 text-sm mt-1">{errors.cuisines}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Activity Categories</label>
        <select
          multiple
          value={formData.activities}
          onChange={(e) => setFormData({ ...formData, activities: Array.from(e.target.selectedOptions, option => option.value) })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          {activityCategories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {errors.activities && <p className="text-red-500 text-sm mt-1">{errors.activities}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Departure City</label>
        <select
          value={formData.departure_city}
          onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          <option value="">Select City</option>
          {destinations.map(dest => (
            <option key={dest.id} value={dest.id}>{dest.name}</option>
          ))}
        </select>
        {errors.departure_city && <p className="text-red-500 text-sm mt-1">{errors.departure_city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Arrival City</label>
        <select
          value={formData.arrival_city}
          onChange={(e) => setFormData({ ...formData, arrival_city: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          <option value="">Select City</option>
          {destinations.map(dest => (
            <option key={dest.id} value={dest.id}>{dest.name}</option>
          ))}
        </select>
        {errors.arrival_city && <p className="text-red-500 text-sm mt-1">{errors.arrival_city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Departure Date</label>
        <input
          type="date"
          value={formData.departure_date}
          onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        {errors.departure_date && <p className="text-red-500 text-sm mt-1">{errors.departure_date}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
        <input
          type="date"
          value={formData.arrival_date}
          onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        {errors.arrival_date && <p className="text-red-500 text-sm mt-1">{errors.arrival_date}</p>}
        {errors.dates && <p className="text-red-500 text-sm mt-1">{errors.dates}</p>}
      </div>
    </motion.div>
  );

  const renderStep2 = () => {
    const totalDays = getTotalDays();
    const selectedDays = formData.destinations.reduce((sum, dest) => sum + (dest.days || 0), 0);
    const { isValid, error } = validateStep2();

    const addDestination = (destId) => {
      const dest = destinations.find(d => d.id === parseInt(destId));
      if (
        dest &&
        !formData.destinations.find(d => d.id === dest.id) &&
        dest.id !== parseInt(formData.departure_city) &&
        dest.id !== parseInt(formData.arrival_city)
      ) {
        setFormData({
          ...formData,
          destinations: [...formData.destinations, { id: dest.id, name: dest.name, days: 1 }],
        });
      }
    };

    const updateDays = (destId, days) => {
      const newDays = parseInt(days) || 1;
      setFormData({
        ...formData,
        destinations: formData.destinations.map(dest =>
          dest.id === destId ? { ...dest, days: newDays } : dest
        ),
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-3xl font-bold text-gray-800">Plan Your Route</h2>
        <p className="text-gray-600">Total trip duration: {totalDays} days</p>
        <p className={`text-gray-600 ${selectedDays === totalDays ? 'text-green-600' : 'text-red-600'}`}>
          Current total days: {selectedDays} / {totalDays}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">Add Intermediate Destination</label>
          <select
            onChange={(e) => addDestination(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Destination</option>
            {destinations
              .filter(dest => !formData.destinations.find(d => d.id === dest.id))
              .map(dest => (
                <option key={dest.id} value={dest.id}>{dest.name}</option>
              ))}
          </select>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700">Assign Days</h3>
          <div className="mt-4 space-y-4">
            {formData.destinations.map(dest => (
              <div key={dest.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
                <span className="text-gray-700 font-medium">
                  {dest.id === parseInt(formData.departure_city) ? '[Departure] ' : dest.id === parseInt(formData.arrival_city) ? '[Arrival] ' : ''}{dest.name}
                </span>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    value={dest.days}
                    onChange={(e) => updateDays(dest.id, e.target.value)}
                    className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      destinations: formData.destinations.filter(d => d.id !== dest.id),
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {errors.days && <p className="text-red-500 text-sm mt-4">{errors.days}</p>}
        </div>
      </motion.div>
    );
  };

  const renderStep4 = () => {
    const circuit = formData.circuit || { orderedDestinations: formData.destinations };
    const totalDays = getTotalDays();
    const nights = totalDays - 1;

    const originDest = destinations.find(d => d.id === parseInt(formData.departure_city));
    const destinationDest = destinations.find(d => d.id === parseInt(formData.arrival_city));

    console.log('Destinations array from Redux:', destinations);
    console.log('Circuit in renderStep4:', circuit);
    console.log('FormData selectedEntities in renderStep4:', formData.selectedEntities);
    console.log('Departure city ID:', formData.departure_city, 'Found:', originDest);
    console.log('Arrival city ID:', formData.arrival_city, 'Found:', destinationDest);

    const fallbackCoordinates = {
      "Tunis": { lat: 36.8065, lng: 10.1815 },
      "Sousse": { lat: 35.8256, lng: 10.6412 },
      "Sfax": { lat: 34.7406, lng: 10.7603 },
      "Gabès": { lat: 33.8815, lng: 10.0982 },
      "Tataouine": { lat: 32.9297, lng: 10.4518 },
    };

    const waypoints = (circuit.orderedDestinations || []).map((dest, index) => {
      const destination = destinations.find(d => d.id === dest.id);
      if (!destination) {
        console.warn(`Destination not found in destinations array for ID ${dest.id} (${dest.name})`);
        return null;
      }
      const lat = destination.latitude || fallbackCoordinates[dest.name]?.lat;
      const lng = destination.longitude || fallbackCoordinates[dest.name]?.lng;
      if (!lat || !lng) {
        console.warn(`Missing coordinates for destination ${dest.name} (ID: ${dest.id}). No fallback available.`);
        return null;
      }
      console.log(`Waypoint ${index + 1}: ${dest.name} at [${lat}, ${lng}]`);
      return {
        lat,
        lng,
        name: `${dest.name}${index === 0 ? ' (Departure)' : index === circuit.orderedDestinations.length - 1 ? ' (Arrival)' : ''}`,
      };
    }).filter(point => point !== null);

    console.log('Prepared waypoints:', waypoints);

    let globalDay = 1;

    const defaultCenter = [36.8065, 10.1815];
    const mapCenter = originDest && originDest.latitude && originDest.longitude
      ? [originDest.latitude, originDest.longitude]
      : defaultCenter;
    console.log('Map center:', mapCenter);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6"
      >
        {/* Map Section */}
        <div className="w-full md:w-1/2 h-96 md:h-[600px] circuit-wizard-map-container">
          {isMapVisible && waypoints.length >= 1 ? (
            <MapContainer
              center={mapCenter}
              zoom={6}
              className="circuit-wizard-map"
              key={waypoints.map(p => `${p.lat}-${p.lng}`).join('-')}
              whenReady={(map) => {
                console.log('MapContainer is ready');
                setTimeout(() => {
                  map.target.invalidateSize();
                  console.log('Map size invalidated in whenReady');
                }, 500);
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                eventHandlers={{
                  tileerror: (e) => {
                    console.error('Tile loading error:', e);
                  },
                  tileload: () => {
                    console.log('Tile loaded successfully');
                  },
                }}
              />
              <MapInitializer />
              {waypoints.map((point, index) => (
                <Marker key={index} position={[point.lat, point.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{point.name}</strong>
                      <p>Stop {index + 1} of {waypoints.length}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}
            </MapContainer>
          ) : (
            <p className="text-center text-gray-500 pt-40">
              {isMapVisible
                ? `Unable to display map: Need at least one destination with valid coordinates. (Waypoints count: ${waypoints.length})`
                : 'Loading map...'}
            </p>
          )}
        </div>

        {/* Itinerary Section */}
        <div className="w-full md:w-1/2 space-y-6 overflow-y-auto md:max-h-[600px]">
          <h2 className="text-2xl font-bold text-gray-800">
            Circuit {originDest?.name || 'Unknown'} to {destinationDest?.name || 'Unknown'}: {totalDays} Day(s) / {nights} Night(s)
          </h2>
          {(circuit.orderedDestinations || []).map(dest => {
            return Array.from({ length: dest.days }, (_, dayIndex) => {
              const localDay = dayIndex + 1;
              const entities = formData.selectedEntities[dest.id]?.[localDay] || {};
              console.log(`Rendering ${dest.name} (ID: ${dest.id}) on Local Day ${localDay} (Global Day ${globalDay}):`, entities);

              const hotel = formData.accommodation === 'hôtel' ? entities.hotel : entities.guest_house;
              const restaurant = entities.restaurant;
              const activity = entities.activity || entities.museum || entities.festival || entities.archaeological_site;

              const dayBlock = (
                <div key={`${dest.id}-${localDay}`} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Day {globalDay} - {dest.name}
                    </h3>
                    <button className="text-blue-500 hover:text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-600">Accommodation</h4>
                      {hotel ? (
                        <div className="mt-2 bg-gray-100 p-3 rounded-md">
                          <p className="text-gray-800">{hotel.name}</p>
                          <p className="text-sm text-gray-600">Address: {hotel.address || 'N/A'}</p>
                          <p className="text-sm text-gray-600">From {hotel.price || 'N/A'} DT</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No accommodation selected.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-600">Restaurants</h4>
                      {restaurant ? (
                        <div className="mt-2 bg-gray-100 p-3 rounded-md">
                          <p className="text-gray-800">{restaurant.name}</p>
                          <p className="text-sm text-gray-600">Address: {restaurant.address || 'N/A'}</p>
                          <p className="text-sm text-gray-600">From {restaurant.price || 'N/A'} DT</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No restaurant selected.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-600">Activities</h4>
                      {activity ? (
                        <div className="mt-2 bg-gray-100 p-3 rounded-md">
                          <p className="text-gray-800">{activity.name}</p>
                          <p className="text-sm text-gray-600">Address: {activity.address || 'N/A'}</p>
                          <p className="text-sm text-gray-600">From {activity.price || 'N/A'} DT</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No activity selected.</p>
                      )}
                    </div>
                  </div>
                </div>
              );

              globalDay++;
              return dayBlock;
            });
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Circuit Wizard</h1>
      {destinationError && <p className="text-red-500 mb-4">Error loading destinations: {destinationError}</p>}
      {entitiesError && <p className="text-red-500 mb-4">Error loading entities: {entitiesError}</p>}
      {errors.api && <p className="text-red-500 mb-4">{errors.api}</p>}
      {destinationsLoading ? (
        <p className="text-gray-600">Loading destinations...</p>
      ) : (
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && <div key="step1">{renderStep1()}</div>}
            {step === 2 && <div key="step2">{renderStep2()}</div>}
            {step === 3 && <div key="step3"><Step3 formData={formData} setFormData={setFormData} destinations={destinations} /></div>}
            {step === 4 && <div key="step4">{renderStep4()}</div>}
          </AnimatePresence>
        </div>
      )}
      <div className="mt-8 flex justify-between">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className={`px-6 py-3 ${isSubmitting ? 'bg-indigo-300' : 'bg-indigo-500'} text-white rounded-md hover:bg-indigo-600 transition ${step === 1 ? 'ml-auto' : ''}`}
        >
          {isSubmitting ? 'Processing...' : step === 4 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default CircuitWizard;