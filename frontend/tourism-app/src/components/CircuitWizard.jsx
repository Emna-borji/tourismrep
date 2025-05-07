import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDestinations } from '../redux/actions/destinationActions';
import { fetchCuisines, fetchActivityCategories, savePreference } from '../redux/actions/preferenceActions';
import { fetchEntities, clearEntities } from '../redux/actions/entityActions';
import { composeCircuit, checkExistingCircuit, fetchCircuitDetails } from '../redux/actions/circuitActions';
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

    setFormData((prev) => {
      const isAlreadySelected =
        prev.selectedEntities[destId]?.[day]?.[entityType]?.id === entity?.id;
      const updated = {
        ...prev,
        selectedEntities: {
          ...prev.selectedEntities,
          [destId]: {
            ...prev.selectedEntities[destId],
            [day]: {
              ...prev.selectedEntities[destId]?.[day],
              [entityType]: isAlreadySelected ? null : entity,
            },
          },
        },
      };
      console.log('Updated selectedEntities:', updated.selectedEntities);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Select Entities for Your Trip</h2>
      {formData.destinations.map((dest) => (
        <div key={dest.id} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">{dest.name}</h3>
          {Array.from({ length: dest.days }, (_, i) => i + 1).map((day) => (
            <div key={day} className="ml-4 mt-4">
              <h4 className="text-lg font-medium">Day {day}</h4>
              {[
                'hotel',
                'guest_house',
                'restaurant',
                'activity',
                'museum',
                'festival',
                'archaeological_site',
              ].map((entityType) => {
                if (entityType === 'hotel' && formData.accommodation !== 'hôtel') return null;
                if (entityType === 'guest_house' && formData.accommodation !== "maison d'hôte") return null;

                const suggestions = circuitEntities
                  .filter((e) => {
                    const matchesType = e.entityType === entityType;
                    const matchesDestination = e.destinationId === dest.id;
                    const matchesDay = e.day === day;
                    const matchesDestinationName =
                      Array.isArray(e.data) &&
                      e.data.length > 0 &&
                      e.data.some((entity) => {
                        const entityDestName =
                          typeof entity.destination === 'string'
                            ? entity.destination.toLowerCase()
                            : (entity.destination?.name || '').toLowerCase();
                        return entityDestName === dest.name.toLowerCase();
                      });
                    return (
                      matchesType &&
                      matchesDestination &&
                      matchesDay &&
                      matchesDestinationName
                    );
                  })
                  .flatMap((e) => e.data)
                  .slice(0, 5);

                return (
                  <div key={entityType} className="mt-2">
                    <label className="block text-sm font-medium text-gray-600">
                      {entityType.charAt(0).toUpperCase() +
                        entityType.slice(1).replace('_', ' ')}
                    </label>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No suggestions available for {entityType} in {dest.name} on Day {day}.
                      </p>
                    ) : entityType === 'hotel' || entityType === 'guest_house' ? (
                      <select
                        onChange={(e) => {
                          const entity = suggestions.find(
                            (s) => s.id === parseInt(e.target.value)
                          );
                          selectEntity(dest.id, day, entityType, entity);
                        }}
                        className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                        value={
                          formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id || ''
                        }
                      >
                        <option value="">
                          Select {entityType.replace('_', ' ')}
                        </option>
                        {suggestions.map((entity) => (
                          <option key={entity.id} value={entity.id}>
                            {entity.name} - {entity.price ? `${entity.price} DT` : 'Price N/A'} 
                            {entityType === 'hotel' && entity.stars ? ` (${entity.stars} stars)` : ''}
                            {entityType === 'guest_house' && entity.category ? ` (${entity.category})` : ''}
                            {entity.rating ? `, Rating: ${entity.rating}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      suggestions.map((entity) => (
                        <div key={entity.id} className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={
                              formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id ===
                              entity.id
                            }
                            onChange={() =>
                              selectEntity(dest.id, day, entityType, entity)
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                          />
                          <span className="ml-2 text-gray-700">
                            {entity.name} - {entity.price ? `${entity.price} DT` : 'Price N/A'}
                            {entityType === 'restaurant' && entity.forks ? ` (${entity.forks} forks)` : ''}
                            {entityType === 'activity' && entity.category ? ` (${entity.category})` : ''}
                            {entityType === 'museum' && entity.exhibition ? ` (${entity.exhibition})` : ''}
                            {entityType === 'festival' && entity.date ? ` (${entity.date})` : ''}
                            {entityType === 'archaeological_site' && entity.historical_period ? ` (${entity.historical_period})` : ''}
                            {entity.rating ? `, Rating: ${entity.rating}` : ''}
                          </span>
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
    if (!map || waypoints.length < 2) return;

    const initializeRouting = () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Routing.Control || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const routingControl = L.Routing.control({
        waypoints: waypoints.map((point) => L.latLng(point.lat, point.lng)),
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
        if (routes.length > 0) {
          const routeCoordinates = routes[0].coordinates.map((coord) => [
            coord.lat,
            coord.lng,
          ]);
          L.polyline(routeCoordinates, {
            color: '#1E90FF',
            weight: 5,
            opacity: 0.7,
          }).addTo(map);

          const bounds = L.latLngBounds(routeCoordinates);
          map.fitBounds(bounds, { padding: [50, 50] });

          L.polyline(
            waypoints.map((point) => [point.lat, point.lng]),
            {
              color: 'red',
              weight: 3,
              opacity: 0.5,
              dashArray: '5, 10',
            }
          ).addTo(map);
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
      map.eachLayer((layer) => {
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
  const {
    destinations = [],
    error: destinationError = null,
  } = useSelector((state) => state.destinations || {});
  const { cuisines = [], activityCategories = [] } = useSelector(
    (state) => state.preference || {}
  );
  const { userInfo = {} } = useSelector((state) => state.auth || {});
  const { error: entitiesError } = useSelector((state) => state.entities || {});
  const { loading: circuitLoading } = useSelector(
    (state) => state.circuit || {}
  );

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
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingCircuitId, setExistingCircuitId] = useState(null);

  useEffect(() => {
    dispatch(fetchDestinations());
    dispatch(fetchCuisines());
    dispatch(fetchActivityCategories());
    dispatch(clearEntities());
  }, [dispatch]);

  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        setIsMapVisible(true);
      }, 600);
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

  const calculateEntityPrice = useCallback(() => {
    const totalPrice = formData.destinations.reduce((acc, dest) => {
      const daysPrice = Array.from({ length: dest.days }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const entities = formData.selectedEntities[dest.id]?.[day] || {};
        return Object.values(entities).reduce((dayAcc, entity) => {
          if (entity && entity.price) {
            return dayAcc + (parseFloat(entity.price) || 0);
          }
          return dayAcc;
        }, 0);
      }).reduce((sum, price) => sum + price, 0);
      return acc + daysPrice;
    }, 0);
    return totalPrice;
  }, [formData.destinations, formData.selectedEntities]);

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    if (destinations.length === 0) {
      newErrors.destinations = 'No destinations available. Please try again later.';
      return newErrors;
    }
    if (!formData.budget || formData.budget <= 0)
      newErrors.budget = 'Budget is required and must be positive';
    if (!formData.stars && formData.accommodation === 'hôtel')
      newErrors.stars = 'Stars are required for hotels';
    if (
      !formData.guest_house_category &&
      formData.accommodation === "maison d'hôte"
    )
      newErrors.guest_house_category = 'Category is required for guest houses';
    if (!formData.forks) newErrors.forks = 'Forks are required';
    if (formData.cuisines.length === 0)
      newErrors.cuisines = 'Select at least one cuisine';
    if (formData.activities.length === 0)
      newErrors.activities = 'Select at least one activity category';
    if (!formData.departure_city) {
      newErrors.departure_city = 'Departure city is required';
    } else {
      const departureDest = destinations.find(
        (d) => d.id === parseInt(formData.departure_city)
      );
      if (!departureDest) {
        newErrors.departure_city = 'Invalid departure city selected';
      }
    }
    if (!formData.arrival_city) {
      newErrors.arrival_city = 'Arrival city is required';
    } else {
      const arrivalDest = destinations.find(
        (d) => d.id === parseInt(formData.arrival_city)
      );
      if (!arrivalDest) {
        newErrors.arrival_city = 'Invalid arrival city selected';
      }
    }
    if (formData.departure_date && formData.arrival_date) {
      const depDate = new Date(formData.departure_date);
      const arrDate = new Date(formData.arrival_date);
      if (depDate >= arrDate)
        newErrors.dates = 'Arrival date must be after departure date';
    }
    return newErrors;
  }, [formData, destinations]);

  const validateStep2 = useCallback(() => {
    const totalDays = getTotalDays();
    const selectedDays = formData.destinations.reduce(
      (sum, dest) => sum + (dest.days || 0),
      0
    );
    const departureDest = destinations.find(
      (d) => d.id === parseInt(formData.departure_city)
    );
    const arrivalDest = destinations.find(
      (d) => d.id === parseInt(formData.arrival_city)
    );
    const hasDeparture = formData.destinations.some(
      (dest) => dest.id === departureDest?.id
    );
    const hasArrival = formData.destinations.some(
      (dest) => dest.id === arrivalDest?.id
    );

    if (!hasDeparture || !hasArrival) {
      return {
        isValid: false,
        error:
          'Departure and arrival cities must be included in the destinations list.',
      };
    }

    return {
      isValid: selectedDays === totalDays,
      error:
        selectedDays !== totalDays
          ? `Total days (${selectedDays}) must equal trip duration (${totalDays})`
          : null,
    };
  }, [
    formData.destinations,
    getTotalDays,
    formData.departure_city,
    formData.arrival_city,
    destinations,
  ]);

  const validateStep3 = useCallback(() => {
    const newErrors = {};
    let hasEntities = false;

    formData.destinations.forEach((dest) => {
      for (let day = 1; day <= dest.days; day++) {
        const entities = formData.selectedEntities[dest.id]?.[day] || {};
        const hasEntity =
          entities.hotel ||
          entities.guest_house ||
          entities.restaurant ||
          entities.activity ||
          entities.museum ||
          entities.festival ||
          entities.archaeological_site;
        if (hasEntity) {
          hasEntities = true;
        }
      }
    });

    if (!hasEntities) {
      newErrors.entities =
        'Please select at least one entity (e.g., hotel, restaurant, activity) for at least one day in your trip.';
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

  const handleProceedWithNewCircuit = async () => {
    setShowDuplicateDialog(false);
    setExistingCircuitId(null);
    try {
      const stops = [];
      let currentOrder = 1;
      formData.destinations.forEach((dest) => {
        for (let day = 1; day <= dest.days; day++) {
          const entities = formData.selectedEntities[dest.id]?.[day] || {};
          const stop = {
            destination_id: parseInt(dest.id),
            day: day,
            order: currentOrder,
            distance_km: 0,
            hotel_id: entities.hotel?.id || null,
            guest_house_id: entities.guest_house?.id || null,
            restaurant_id: entities.restaurant?.id || null,
            activity_id: entities.activity?.id || null,
            museum_id: entities.museum?.id || null,
            festival_id: entities.festival?.id || null,
            archaeological_site_id: entities.archaeological_site?.id || null,
          };
          stops.push(stop);
          currentOrder++;
        }
      });
      console.log('Stops being sent to backend:', stops);

      const totalDays = getTotalDays();
      const entityPrice = calculateEntityPrice();

      const circuitData = {
        name: `Circuit ${formData.departure_city} to ${formData.arrival_city} ${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        circuit_code: `CIRC${Date.now()}${Math.floor(Math.random() * 1000)}`.toUpperCase(),
        departure_city: parseInt(formData.departure_city),
        arrival_city: parseInt(formData.arrival_city),
        price: entityPrice,
        duration: totalDays,
        destinations: formData.destinations.map((dest) => ({
          destination_id: parseInt(dest.id),
          days: dest.days,
        })),
        stops: stops,
        preferences: {
          budget: parseFloat(formData.budget),
          accommodation: formData.accommodation,
          stars: formData.accommodation === 'hôtel' ? parseInt(formData.stars) : null,
          guest_house_category: formData.accommodation === "maison d'hôte" ? formData.guest_house_category : null,
          forks: parseInt(formData.forks),
          cuisine_id: formData.cuisines.length > 0 ? parseInt(formData.cuisines[0]) : null,
          activity_category_id: formData.activities.length > 0 ? parseInt(formData.activities[0]) : null,
          departure_city: parseInt(formData.departure_city),
          arrival_city: parseInt(formData.arrival_city),
          departure_date: formData.departure_date,
          arrival_date: formData.arrival_date,
        },
      };

      console.log('Circuit data sent to composeCircuit:', circuitData);

      const response = await dispatch(composeCircuit(circuitData));

      setFormData((prev) => {
        const orderedDestinations = response.ordered_destinations || prev.destinations.map(d => ({
          id: d.id,
          name: destinations.find(dd => dd.id === d.id)?.name || d.name || 'Unknown',
          days: d.days,
          latitude: destinations.find(dd => dd.id === d.id)?.latitude || 36.8065,
          longitude: destinations.find(dd => dd.id === d.id)?.longitude || 10.1815,
        }));
        const updated = {
          ...prev,
          destinations: orderedDestinations.map((dest) => ({
            id: dest.id,
            name: dest.name,
            days: dest.days,
          })),
          circuit: {
            ...response,
            orderedDestinations: orderedDestinations,
          },
        };
        return updated;
      });
      setStep(4);
    } catch (error) {
      setErrors({
        api: error.message || 'Failed to generate circuit. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewExistingCircuit = async () => {
    setShowDuplicateDialog(false);
    if (existingCircuitId) {
      try {
        await dispatch(fetchCircuitDetails(existingCircuitId));
        const circuitData = store.getState().circuit.circuit;

        if (!circuitData) {
          throw new Error('Failed to retrieve circuit data');
        }

        console.log('Fetched circuit data:', circuitData);
        console.log('Destinations array:', destinations);
        console.log('Circuit schedules:', circuitData.schedules);

        const orderedDestinations = (circuitData.schedules || []).map((schedule) => {
          const matchedDest = destinations.find(d => d.id === schedule.destination_id);
          return {
            id: matchedDest ? matchedDest.id : schedule.destination_id,
            name: matchedDest ? matchedDest.name : schedule.destination_name || 'Unknown Destination',
            days: schedule.day || 1,
            latitude: matchedDest ? matchedDest.latitude : 36.8065,
            longitude: matchedDest ? matchedDest.longitude : 10.1815,
          };
        }).filter(dest => dest.id);

        console.log('Mapped orderedDestinations:', orderedDestinations);

        if (orderedDestinations.length === 0) {
          throw new Error('No valid destinations found in the existing circuit');
        }

        const selectedEntities = {};
        const schedules = circuitData.schedules || [];
        console.log('Processing schedules to build selectedEntities:', schedules);

        schedules.forEach((schedule) => {
          const destId = schedule.destination_id;
          const day = schedule.day;

          if (!selectedEntities[destId]) {
            selectedEntities[destId] = {};
          }
          if (!selectedEntities[destId][day]) {
            selectedEntities[destId][day] = {};
          }

          const entityTypes = [
            { type: 'hotel', data: schedule.hotel },
            { type: 'guest_house', data: schedule.guest_house },
            { type: 'restaurant', data: schedule.restaurant },
            { type: 'activity', data: schedule.activity },
            { type: 'museum', data: schedule.museum },
            { type: 'festival', data: schedule.festival },
            { type: 'archaeological_site', data: schedule.archaeological_site },
          ];

          entityTypes.forEach(({ type, data }) => {
            if (data && Object.keys(data).length > 0) {
              selectedEntities[destId][day][type] = {
                id: data.id,
                name: data.name,
                address: data.address || 'N/A',
                price: data.price != null ? data.price : 'N/A',
                stars: data.stars || null,
                category: data.category || null,
                forks: data.forks || null,
                exhibition: data.exhibition || null,
                date: data.date || null,
                historical_period: data.historical_period || null,
                rating: data.rating != null ? data.rating : 'N/A',
              };
            }
          });
        });

        console.log('Populated selectedEntities:', selectedEntities);

        setFormData((prev) => ({
          ...prev,
          departure_city: circuitData.departure_city?.toString() || prev.departure_city,
          arrival_city: circuitData.arrival_city?.toString() || prev.arrival_city,
          departure_date: circuitData.preferences?.departure_date || prev.departure_date,
          arrival_date: circuitData.preferences?.arrival_date || prev.arrival_date,
          accommodation: circuitData.preferences?.accommodation || prev.accommodation,
          destinations: orderedDestinations.map((dest) => ({
            id: dest.id,
            name: dest.name,
            days: dest.days,
          })),
          selectedEntities,
          circuit: {
            ...circuitData,
            orderedDestinations,
          },
        }));

        setStep(4);
        console.log('Step updated to 4, formData:', formData);
      } catch (error) {
        console.error('Error in handleViewExistingCircuit:', error);
        setErrors({
          api: error.message || 'Failed to fetch existing circuit. Please try again.',
        });
      } finally {
        setExistingCircuitId(null);
      }
    }
  };

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
            cuisines: formData.cuisines.map((id) => ({ cuisine: id })),
            activities: formData.activities.map((id) => ({ activity_category: id })),
            departure_city: formData.departure_city,
            arrival_city: formData.arrival_city,
            departure_date: formData.departure_date,
            arrival_date: formData.arrival_date,
          };
          await dispatch(savePreference(preferenceData));
          const departureDest = destinations.find(
            (d) => d.id === parseInt(formData.departure_city)
          );
          const arrivalDest = destinations.find(
            (d) => d.id === parseInt(formData.arrival_city)
          );
          setFormData((prev) => ({
            ...prev,
            destinations: [
              { id: departureDest?.id, name: departureDest?.name, days: 1 },
              { id: arrivalDest?.id, name: arrivalDest?.name, days: 1 },
            ].filter((dest) => dest.id),
          }));
          setStep(2);
        } catch (error) {
          setErrors({
            api: error.message || 'Failed to save preferences. Please try again.',
          });
        }
      }
    } else if (step === 2) {
      const { isValid, error } = validateStep2();
      if (isValid) {
        const departureDest = destinations.find(
          (d) => d.id === parseInt(formData.departure_city)
        );
        const arrivalDest = destinations.find(
          (d) => d.id === parseInt(formData.arrival_city)
        );
        const intermediateDests = formData.destinations.filter(
          (dest) => dest.id !== departureDest?.id && dest.id !== arrivalDest?.id
        );
        const updatedDestinations = [
          {
            id: departureDest?.id,
            name: departureDest?.name,
            days: formData.destinations.find((d) => d.id === departureDest?.id)?.days || 1,
          },
          ...intermediateDests,
          {
            id: arrivalDest?.id,
            name: arrivalDest?.name,
            days: formData.destinations.find((d) => d.id === arrivalDest?.id)?.days || 1,
          },
        ].filter((dest) => dest.id);

        setFormData((prev) => ({
          ...prev,
          destinations: updatedDestinations,
        }));

        const entityPromises = [];
        const entityTypes = [
          'hotel',
          'guest_house',
          'restaurant',
          'activity',
          'museum',
          'festival',
          'archaeological_site',
        ];
        updatedDestinations.forEach((dest) => {
          for (let day = 1; day <= dest.days; day++) {
            entityTypes.forEach((entityType) => {
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
                    .then((response) => {
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
                        resolve({
                          destinationId: dest.id,
                          day,
                          entityType,
                          success: true,
                        });
                      } else {
                        resolve({
                          destinationId: dest.id,
                          day,
                          entityType,
                          success: false,
                          error: 'Invalid response data',
                        });
                      }
                    })
                    .catch((err) => {
                      resolve({
                        destinationId: dest.id,
                        day,
                        entityType,
                        success: false,
                        error: err.message,
                      });
                    });
                })
              );
            });
          }
        });

        try {
          const results = await Promise.all(entityPromises);
          const hasErrors = results.some((result) => !result.success);
          const state = store.getState();
          const currentEntities = state.entities?.circuitEntities || [];

          if (currentEntities.length === 0) {
            setErrors({
              api: 'No entities were fetched. You can proceed, but suggestions will be empty.',
            });
            setStep(3);
          } else if (hasErrors) {
            setErrors({
              api: 'Some entities could not be fetched. You can proceed or try again.',
            });
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
        const stops = [];
        let currentOrder = 1;
        formData.destinations.forEach((dest) => {
          for (let day = 1; day <= dest.days; day++) {
            const entities = formData.selectedEntities[dest.id]?.[day] || {};
            const stop = {
              destination_id: parseInt(dest.id),
              day: day,
              order: currentOrder,
              distance_km: 0,
              hotel_id: entities.hotel?.id || null,
              guest_house_id: entities.guest_house?.id || null,
              restaurant_id: entities.restaurant?.id || null,
              activity_id: entities.activity?.id || null,
              museum_id: entities.museum?.id || null,
              festival_id: entities.festival?.id || null,
              archaeological_site_id: entities.archaeological_site?.id || null,
            };
            stops.push(stop);
            currentOrder++;
          }
        });
        console.log('Stops being sent to backend:', stops);

        const totalDays = getTotalDays();
        const entityPrice = calculateEntityPrice();

        const circuitData = {
          name: `Circuit ${formData.departure_city} to ${formData.arrival_city} ${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          circuit_code: `CIRC${Date.now()}${Math.floor(Math.random() * 1000)}`.toUpperCase(),
          departure_city: parseInt(formData.departure_city),
          arrival_city: parseInt(formData.arrival_city),
          price: entityPrice,
          duration: totalDays,
          destinations: formData.destinations.map((dest) => ({
            destination_id: parseInt(dest.id),
            days: dest.days,
          })),
          stops: stops,
          preferences: {
            budget: parseFloat(formData.budget),
            accommodation: formData.accommodation,
            stars: formData.accommodation === 'hôtel' ? parseInt(formData.stars) : null,
            guest_house_category: formData.accommodation === "maison d'hôte" ? formData.guest_house_category : null,
            forks: parseInt(formData.forks),
            cuisine_id: formData.cuisines.length > 0 ? parseInt(formData.cuisines[0]) : null,
            activity_category_id: formData.activities.length > 0 ? parseInt(formData.activities[0]) : null,
            departure_city: parseInt(formData.departure_city),
            arrival_city: parseInt(formData.arrival_city),
            departure_date: formData.departure_date,
            arrival_date: formData.arrival_date,
          },
        };

        const checkData = {
          departure_city: circuitData.departure_city,
          arrival_city: circuitData.arrival_city,
          duration: circuitData.duration,
          destinations: circuitData.destinations,
          stops: circuitData.stops,
          price: entityPrice,
        };
        console.log('Check data sent to checkExistingCircuit:', checkData);

        const { exists, circuitId, error } = await dispatch(checkExistingCircuit(checkData));

        if (error) {
          setErrors({ api: error });
          setIsSubmitting(false);
          return;
        }

        if (exists) {
          setExistingCircuitId(circuitId);
          setShowDuplicateDialog(true);
          setIsSubmitting(false);
          return;
        }

        console.log('Circuit data sent to composeCircuit:', circuitData);
        const response = await dispatch(composeCircuit(circuitData));

        setFormData((prev) => {
          const orderedDestinations = response.ordered_destinations || prev.destinations.map(d => ({
            id: d.id,
            name: destinations.find(dd => dd.id === d.id)?.name || d.name || 'Unknown',
            days: d.days,
            latitude: destinations.find(dd => dd.id === d.id)?.latitude || 36.8065,
            longitude: destinations.find(dd => dd.id === d.id)?.longitude || 10.1815,
          }));
          const updated = {
            ...prev,
            destinations: orderedDestinations.map((dest) => ({
              id: dest.id,
              name: dest.name,
              days: dest.days,
            })),
            circuit: {
              ...response,
              orderedDestinations: orderedDestinations,
            },
          };
          return updated;
        });
        setStep(4);
      } catch (error) {
        setErrors({
          api: error.message || 'Failed to generate circuit. Please try again.',
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

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="intro-section">
        <div className="intro-image">
          <img src="https://www.freeiconspng.com/thumbs/travel-icon-png/plane-travel-flight-tourism-travel-icon-png-10.png" alt="Travel Planning" />
        </div>
        <div className="intro-text">
          <h1>Let’s Plan Your Perfect Trip!</h1>
          <p>
            <span className="step">Step 1:</span> Tell us your{' '}
            <strong>preferences</strong> to create a personalized travel circuit.
            Choose your budget, accommodation, dining options, and more to get
            started.
          </p>
        </div>
      </div>

      <div className="step1-form">
        <div className="input-row">
          <div className="input-group">
            <label>Departure City</label>
            <select
              value={formData.departure_city}
              onChange={(e) =>
                setFormData({ ...formData, departure_city: e.target.value })
              }
            >
              <option value="">Select City</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
            {errors.departure_city && (
              <p className="text-red-500 text-sm mt-1">{errors.departure_city}</p>
            )}
          </div>
          <div className="input-group">
            <label>Arrival City</label>
            <select
              value={formData.arrival_city}
              onChange={(e) =>
                setFormData({ ...formData, arrival_city: e.target.value })
              }
            >
              <option value="">Select City</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
            {errors.arrival_city && (
              <p className="text-red-500 text-sm mt-1">{errors.arrival_city}</p>
            )}
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Departure Date</label>
            <input
              type="date"
              value={formData.departure_date}
              onChange={(e) =>
                setFormData({ ...formData, departure_date: e.target.value })
              }
            />
            {errors.departure_date && (
              <p className="text-red-500 text-sm mt-1">{errors.departure_date}</p>
            )}
          </div>
          <div className="input-group">
            <label>Arrival Date</label>
            <input
              type="date"
              value={formData.arrival_date}
              onChange={(e) =>
                setFormData({ ...formData, arrival_date: e.target.value })
              }
            />
            {errors.arrival_date && (
              <p className="text-red-500 text-sm mt-1">{errors.arrival_date}</p>
            )}
            {errors.dates && (
              <p className="text-red-500 text-sm mt-1">{errors.dates}</p>
            )}
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Budget (TND)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) =>
                setFormData({ ...formData, budget: e.target.value })
              }
              placeholder="Enter your budget"
            />
            {errors.budget && (
              <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
            )}
          </div>
          <div className="input-group">
            <label>Accommodation Type</label>
            <select
              value={formData.accommodation}
              onChange={(e) =>
                setFormData({ ...formData, accommodation: e.target.value })
              }
            >
              <option value="hôtel">Hôtel</option>
              <option value="maison d'hôte">Maison d’hôte</option>
            </select>
          </div>
        </div>

        <div className="input-row">
          {formData.accommodation === 'hôtel' && (
            <div className="input-group">
              <label>Stars</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.stars}
                onChange={(e) =>
                  setFormData({ ...formData, stars: e.target.value })
                }
                placeholder="1-5"
              />
              {errors.stars && (
                <p className="text-red-500 text-sm mt-1">{errors.stars}</p>
              )}
            </div>
          )}
          {formData.accommodation === "maison d'hôte" && (
            <div className="input-group">
              <label>Guest House Category</label>
              <select
                value={formData.guest_house_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guest_house_category: e.target.value,
                  })
                }
              >
                <option value="">Select Category</option>
                <option value="Luxe">Luxe</option>
                <option value="Moyenne gamme">Moyenne gamme</option>
                <option value="Économie">Économie</option>
              </select>
              {errors.guest_house_category && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.guest_house_category}
                </p>
              )}
            </div>
          )}
          {(formData.accommodation === 'hôtel' ||
            formData.accommodation === "maison d'hôte") && (
            <div className="input-group">
              <label>Forks (Restaurant Rating)</label>
              <input
                type="number"
                min="1"
                max="3"
                value={formData.forks}
                onChange={(e) =>
                  setFormData({ ...formData, forks: e.target.value })
                }
                placeholder="1-3"
              />
              {errors.forks && (
                <p className="text-red-500 text-sm mt-1">{errors.forks}</p>
              )}
            </div>
          )}
          {formData.accommodation !== 'hôtel' &&
            formData.accommodation !== "maison d'hôte" && (
              <div className="input-group">
                <label>Forks (Restaurant Rating)</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={formData.forks}
                  onChange={(e) =>
                    setFormData({ ...formData, forks: e.target.value })
                  }
                  placeholder="1-3"
                />
                {errors.forks && (
                  <p className="text-red-500 text-sm mt-1">{errors.forks}</p>
                )}
              </div>
            )}
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Cuisines</label>
            <select
              multiple
              value={formData.cuisines}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cuisines: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  ),
                })
              }
            >
              {cuisines.map((cuisine) => (
                <option key={cuisine.id} value={cuisine.id}>
                  {cuisine.name}
                </option>
              ))}
            </select>
            {errors.cuisines && (
              <p className="text-red-500 text-sm mt-1">{errors.cuisines}</p>
            )}
          </div>
          <div className="input-group">
            <label>Activity Categories</label>
            <select
              multiple
              value={formData.activities}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  activities: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  ),
                })
              }
            >
              {activityCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.activities && (
              <p className="text-red-500 text-sm mt-1">{errors.activities}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => {
    const totalDays = getTotalDays();
    const selectedDays = formData.destinations.reduce(
      (sum, dest) => sum + (dest.days || 0),
      0
    );
    const { isValid, error } = validateStep2();

    const addDestination = (destId) => {
      const dest = destinations.find((d) => d.id === parseInt(destId));
      if (
        dest &&
        !formData.destinations.find((d) => d.id === dest.id) &&
        dest.id !== parseInt(formData.departure_city) &&
        dest.id !== parseInt(formData.arrival_city)
      ) {
        setFormData({
          ...formData,
          destinations: [
            ...formData.destinations,
            { id: dest.id, name: dest.name, days: 1 },
          ],
        });
      }
    };

    const updateDays = (destId, days) => {
      const newDays = parseInt(days) || 1;
      setFormData({
        ...formData,
        destinations: formData.destinations.map((dest) =>
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
        <div className="intro-section">
          <div className="intro-image">
            <img src="https://static.vecteezy.com/system/resources/previews/022/556/384/non_2x/the-concept-of-a-plan-with-an-easy-route-a-a-difficult-option-b-and-a-real-life-way-expectation-and-reality-png.png" alt="Route Planning" />
          </div>
          <div className="intro-text">
            <h1>Design Your Travel Route</h1>
            <p>
              <span className="step">Step 2:</span> Select your{' '}
              <strong>destinations</strong> and assign the number of days for each
              stop. Ensure the total matches your trip duration of{' '}
              <strong>{totalDays} days</strong>.
            </p>
          </div>
        </div>

        <p
          className={`text-gray-600 ${
            selectedDays === totalDays ? 'text-green-600' : 'text-red-600'
          }`}
        >
          Current total days: {selectedDays} / {totalDays}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Add Intermediate Destination
          </label>
          <select
            onChange={(e) => addDestination(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Destination</option>
            {destinations
              .filter((dest) => !formData.destinations.find((d) => d.id === dest.id))
              .map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700">Assign Days</h3>
          <div className="mt-4 space-y-4">
            {formData.destinations.map((dest) => (
              <div
                key={dest.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 font-medium">
                  {dest.id === parseInt(formData.departure_city)
                    ? '[Departure] '
                    : dest.id === parseInt(formData.arrival_city)
                    ? '[Arrival] '
                    : ''}
                  {dest.name}
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
                    onClick={() =>
                      setFormData({
                        ...formData,
                        destinations: formData.destinations.filter(
                          (d) => d.id !== dest.id
                        ),
                      })
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </motion.div>
    );
  };

  const renderStep4 = () => {
    const circuit = formData.circuit || {
      orderedDestinations: formData.destinations.map(d => ({
        id: d.id,
        name: d.name || destinations.find(dd => dd.id === d.id)?.name || 'Unknown',
        days: d.days || 1,
        latitude: destinations.find(dd => dd.id === d.id)?.latitude || 36.8065,
        longitude: destinations.find(dd => dd.id === d.id)?.longitude || 10.1815,
      }))
    };
    const totalDays = getTotalDays();
    const nights = totalDays - 1;

    const originDest = destinations.find(
      (d) => d.id === parseInt(formData.departure_city)
    ) || { name: 'Unknown', latitude: 36.8065, longitude: 10.1815 };
    const destinationDest = destinations.find(
      (d) => d.id === parseInt(formData.arrival_city)
    ) || { name: 'Unknown', latitude: 36.8065, longitude: 10.1815 };

    const orderedDestinations = circuit.orderedDestinations.map((dest) => {
      const destination = destinations.find((d) => d.id === dest.id) || {
        latitude: 36.8065,
        longitude: 10.1815,
        name: dest.name || 'Unknown'
      };
      return {
        ...dest,
        latitude: destination.latitude || 36.8065,
        longitude: destination.longitude || 10.1815,
      };
    }).filter(dest => dest.latitude && dest.longitude && !isNaN(dest.latitude) && !isNaN(dest.longitude));

    const waypoints = orderedDestinations
      .map((dest, index) => {
        if (!dest.latitude || !dest.longitude || isNaN(dest.latitude) || isNaN(dest.longitude)) return null;
        return {
          lat: dest.latitude,
          lng: dest.longitude,
          name: `${dest.name}${
            index === 0
              ? ' (Departure)'
              : index === orderedDestinations.length - 1
              ? ' (Arrival)'
              : ''
          }`,
        };
      })
      .filter((point) => point !== null);

    let globalDay = 1;

    const defaultCenter = [36.8065, 10.1815];
    const mapCenter = waypoints.length > 0
      ? [waypoints[0].lat, waypoints[0].lng]
      : defaultCenter;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6"
      >
        <div className="w-full md:w-1/2 h-96 md:h-[600px] circuit-wizard-map-container">
          {isMapVisible && waypoints.length >= 1 ? (
            <MapContainer
              center={mapCenter}
              zoom={6}
              className="circuit-wizard-map"
              key={waypoints.map((p) => `${p.lat}-${p.lng}`).join('-')}
              whenReady={(map) => {
                setTimeout(() => {
                  map.target.invalidateSize();
                }, 500);
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapInitializer />
              {waypoints.map((point, index) => (
                <Marker key={index} position={[point.lat, point.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{point.name}</strong>
                      <p>
                        Stop {index + 1} of {waypoints.length}
                      </p>
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

        <div className="w-full md:w-1/2 space-y-6 overflow-y-auto md:max-h-[600px]">
          <h2 className="text-2xl font-bold text-gray-800">
            Circuit {originDest.name} to {destinationDest.name}: {totalDays} Day(s) / {nights} Night(s)
          </h2>
          {orderedDestinations.length === 0 ? (
            <p className="text-gray-500">No destinations available to display.</p>
          ) : (
            <>
              {orderedDestinations.map((dest) => (
                <React.Fragment key={dest.id}>
                  {Array.from({ length: dest.days }, (_, dayIndex) => {
                    const localDay = dayIndex + 1;
                    const entities = formData.selectedEntities[dest.id]?.[localDay] || {};

                    const hotel =
                      formData.accommodation === 'hôtel'
                        ? entities.hotel
                        : entities.guest_house;
                    const restaurant = entities.restaurant;
                    const activity =
                      entities.activity ||
                      entities.museum ||
                      entities.festival ||
                      entities.archaeological_site;

                    const dayBlock = (
                      <div
                        key={`${dest.id}-${localDay}`}
                        className="bg-white p-4 rounded-lg shadow-md"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-700">
                            Day {globalDay} - {dest.name}
                          </h3>
                          <button className="text-blue-500 hover:text-blue-700">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="text-md font-medium text-gray-600">
                              Accommodation
                            </h4>
                            {hotel ? (
                              <div className="mt-2 bg-gray-100 p-3 rounded-md">
                                <p className="text-gray-800">{hotel.name}</p>
                                <p className="text-sm text-gray-600">
                                  Address: {hotel.address || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Price: {hotel.price != null ? `${hotel.price} DT` : 'N/A'}
                                </p>
                                {hotel.stars && (
                                  <p className="text-sm text-gray-600">
                                    Stars: {hotel.stars}
                                  </p>
                                )}
                                {hotel.category && (
                                  <p className="text-sm text-gray-600">
                                    Category: {hotel.category}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Rating: {hotel.rating != null ? hotel.rating : 'N/A'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No accommodation selected.
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-md font-medium text-gray-600">
                              Restaurants
                            </h4>
                            {restaurant ? (
                              <div className="mt-2 bg-gray-100 p-3 rounded-md">
                                <p className="text-gray-800">{restaurant.name}</p>
                                <p className="text-sm text-gray-600">
                                  Address: {restaurant.address || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Price: {restaurant.price != null ? `${restaurant.price} DT` : 'N/A'}
                                </p>
                                {restaurant.forks && (
                                  <p className="text-sm text-gray-600">
                                    Forks: {restaurant.forks}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Rating: {restaurant.rating != null ? restaurant.rating : 'N/A'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No restaurant selected.
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-md font-medium text-gray-600">
                              Activities
                            </h4>
                            {activity ? (
                              <div className="mt-2 bg-gray-100 p-3 rounded-md">
                                <p className="text-gray-800">{activity.name}</p>
                                <p className="text-sm text-gray-600">
                                  Address: {activity.address || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Price: {activity.price != null ? `${activity.price} DT` : 'N/A'}
                                </p>
                                {activity.category && (
                                  <p className="text-sm text-gray-600">
                                    Category: {activity.category}
                                  </p>
                                )}
                                {activity.exhibition && (
                                  <p className="text-sm text-gray-600">
                                    Exhibition: {activity.exhibition}
                                  </p>
                                )}
                                {activity.date && (
                                  <p className="text-sm text-gray-600">
                                    Date: {activity.date}
                                  </p>
                                )}
                                {activity.historical_period && (
                                  <p className="text-sm text-gray-600">
                                    Historical Period: {activity.historical_period}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Rating: {activity.rating != null ? activity.rating : 'N/A'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No activity selected.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    globalDay++;
                    return dayBlock;
                  })}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Circuit Wizard</h1>
      {destinationError && (
        <p className="text-red-500 mb-4">
          Error loading destinations: {destinationError}
        </p>
      )}
      {errors.destinations && (
        <p className="text-red-500 mb-4">{errors.destinations}</p>
      )}
      {entitiesError && (
        <p className="text-red-500 mb-4">Error loading entities: {entitiesError}</p>
      )}
      {circuitLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && <div key="step1">{renderStep1()}</div>}
            {step === 2 && <div key="step2">{renderStep2()}</div>}
            {step === 3 && (
              <div key="step3">
                <Step3
                  formData={formData}
                  setFormData={setFormData}
                  destinations={destinations}
                />
              </div>
            )}
            {step === 4 && <div key="step4">{renderStep4()}</div>}
          </AnimatePresence>
        </div>
      )}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Duplicate Circuit Found
            </h3>
            <p className="text-gray-600 mb-6">
              A similar circuit already exists. Would you like to view the existing circuit or create a new one?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleViewExistingCircuit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                View Existing
              </button>
              <button
                onClick={handleProceedWithNewCircuit}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
              >
                Create New
              </button>
            </div>
          </div>
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
          disabled={isSubmitting || (step === 2 && !validateStep2().isValid)}
          className={`px-6 py-3 ${
            isSubmitting || (step === 2 && !validateStep2().isValid) ? 'bg-indigo-300' : 'bg-indigo-500'
          } text-white rounded-md hover:bg-indigo-600 transition ${
            step === 1 ? 'ml-auto' : ''
          }`}
        >
          {isSubmitting ? 'Processing...' : step === 4 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default CircuitWizard;