import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDestinations } from '../redux/actions/destinationActions';
import { fetchCuisines, fetchActivityCategories, savePreference } from '../redux/actions/preferenceActions';
import { fetchEntities, clearEntities } from '../redux/actions/entityActions';
import { composeCircuit, checkExistingCircuit, fetchCircuitDetails } from '../redux/actions/circuitActions';
import { saveCircuitToHistory, checkCircuitHistoryDuplicate } from '../redux/actions/circuitHistoryActions';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { store } from '../redux/store';
import HeroSection from './Shared/HeroSection'
import './circuitWizard.css';

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Step 3 Component
const Step3 = ({ formData, setFormData, destinations, remainingBudget }) => {
  const { circuitEntities = [] } = useSelector((state) => state.entities || {});

  const selectEntity = (destId, day, entityType, entity) => {
    if (!destId || !day || !entityType) {
      console.error('Invalid parameters in selectEntity:', { destId, day, entityType, entity });
      return;
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        selectedEntities: {
          ...prev.selectedEntities,
          [destId]: {
            ...prev.selectedEntities[destId],
            [day]: {
              ...prev.selectedEntities[destId]?.[day],
              [entityType]: prev.selectedEntities[destId]?.[day]?.[entityType]?.id === entity?.id ? null : entity,
            },
          },
        },
      };
      console.log('Updated selectedEntities:', updated.selectedEntities);
      return updated;
    });
  };

  // Helper to get all selected entity IDs across the circuit
  const getSelectedEntityIds = () => {
    const selectedIds = new Set();
    Object.keys(formData.selectedEntities).forEach((destId) => {
      Object.keys(formData.selectedEntities[destId]).forEach((day) => {
        Object.keys(formData.selectedEntities[destId][day]).forEach((entityType) => {
          const entity = formData.selectedEntities[destId][day][entityType];
          if (entity?.id) {
            selectedIds.add(entity.id);
          }
        });
      });
    });
    return selectedIds;
  };

  const selectedEntityIds = getSelectedEntityIds();

  return (
    <div className="space-y-6">
      <div className="intro-section">
        <div className="intro-image">
          <img
            src="https://icon-library.com/images/tourism-icon-png/tourism-icon-png-2.jpg"
            alt="Planification d'itinéraire"
          />
        </div>
        <div className="intro-text">
          <h1>Personnalisez votre itinéraire</h1>
          <p>
            <span className="step">Étape 3 :</span> Choisissez les{' '}
            <strong>activités et hébergements</strong> pour chaque jour de votre voyage. Sélectionnez les options qui correspondent le mieux à vos préférences pour chaque étape.
          </p>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-800">Sélectionnez les éléments de votre voyage</h2>
      {formData.budget && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            Budget total: {formData.budget} DT | Budget restant: {remainingBudget.toFixed(2)} DT
          </p>
          {remainingBudget < 0 && (
            <p className="text-sm text-red-500 mt-1">
              Attention : Vous avez dépassé votre budget total !
            </p>
          )}
        </div>
      )}
      {formData.destinations.map((dest) => (
        <div key={dest.id} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">{dest.name}</h3>
          {Array.from({ length: dest.days }, (_, i) => i + 1).map((day) => (
            <div key={day} className="ml-4 mt-4">
              <h4 className="text-lg font-medium">Jour {day}</h4>
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

                // Fetch all matching entities without budget filter initially
                const allSuggestions = circuitEntities
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
                    return matchesType && matchesDestination && matchesDay && matchesDestinationName;
                  })
                  .flatMap((e) => e.data);

                // Split into selected and unselected entities
                const selectedSuggestions = allSuggestions.filter((entity) =>
                  selectedEntityIds.has(entity.id)
                );
                const unselectedSuggestions = allSuggestions
                  .filter((entity) => !selectedEntityIds.has(entity.id))
                  .filter((entity) => {
                    const price = parseFloat(entity.price) || 0;
                    return remainingBudget === Infinity || price <= remainingBudget;
                  });

                // Combine the lists: selected entities always shown, unselected filtered by budget
                const suggestions = [
                  ...selectedSuggestions,
                  ...unselectedSuggestions,
                ]
                  .sort((a, b) => {
                    const priceA = parseFloat(a.price) || 0;
                    const priceB = parseFloat(b.price) || 0;
                    return priceA - priceB;
                  })
                  .slice(0, 5);

                const entityTypeLabels = {
                  hotel: 'Hôtel',
                  guest_house: 'Maison d\'hôte',
                  restaurant: 'Restaurant',
                  activity: 'Activité',
                  museum: 'Musée',
                  festival: 'Festival',
                  archaeological_site: 'Site archéologique',
                };

                return (
                  <div key={entityType} className="mt-2">
                    <label className="block text-sm font-medium text-gray-600">
                      {entityTypeLabels[entityType]}
                    </label>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        Aucune suggestion disponible pour {entityTypeLabels[entityType]} à {dest.name} pour le Jour {day} dans le budget restant.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {suggestions.map((entity) => {
                          // Check if this entity is selected anywhere in the circuit
                          const isSelectedElsewhere =
                            Array.from(Object.keys(formData.selectedEntities)).some((destId) =>
                              Array.from(Object.keys(formData.selectedEntities[destId])).some((day) =>
                                formData.selectedEntities[destId][day][entityType]?.id === entity.id
                              )
                            );

                          return (
                            <div
                              key={entity.id}
                              className="entity-card bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 border border-gray-200"
                            >
                              {entity.image && (
                                <img
                                  src={entity.image}
                                  alt={`Image de ${entity.name}`}
                                  className="w-full h-32 object-cover rounded-t-lg mb-2"
                                />
                              )}
                              <div className="p-2">
                                <h5 className="text-md font-semibold text-gray-800">{entity.name}</h5>
                                <p className="text-sm text-gray-600">
                                  Prix : {entity.price ? `${entity.price} DT` : 'Prix non disponible'}
                                </p>
                                {entityType === 'hotel' && entity.stars && (
                                  <p className="text-sm text-gray-600">Étoiles : {entity.stars}</p>
                                )}
                                {entityType === 'guest_house' && entity.category && (
                                  <p className="text-sm text-gray-600">Catégorie : {entity.category}</p>
                                )}
                                {entityType === 'restaurant' && entity.forks && (
                                  <p className="text-sm text-gray-600">Fourchettes : {entity.forks}</p>
                                )}
                                {entityType === 'activity' && entity.category && (
                                  <p className="text-sm text-gray-600">Catégorie : {entity.category}</p>
                                )}
                                {entityType === 'museum' && entity.exhibition && (
                                  <p className="text-sm text-gray-600">Exposition : {entity.exhibition}</p>
                                )}
                                {entityType === 'festival' && entity.date && (
                                  <p className="text-sm text-gray-600">Date : {entity.date}</p>
                                )}
                                {entityType === 'archaeological_site' && entity.historical_period && (
                                  <p className="text-sm text-gray-600">Période historique : {entity.historical_period}</p>
                                )}
                                {entity.rating && (
                                  <p className="text-sm text-gray-600">Note : {entity.rating}</p>
                                )}
                                <div className="mt-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id ===
                                      entity.id
                                    }
                                    onChange={() => selectEntity(dest.id, day, entityType, entity)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                                    disabled={isSelectedElsewhere && formData.selectedEntities[dest.id]?.[day]?.[entityType]?.id !== entity.id}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Sélectionner
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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


const entityIcons = {
  activity: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/activity-icon.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  restaurant: new L.Icon({
    iconUrl: 'https://png.pngtree.com/png-vector/20241227/ourmid/pngtree-restaurant-location-pin-icon-vector-png-image_14906347.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  guest_house: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/maison-hote.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  hotel: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/hotel-icon.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  museum: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/musee.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  festival: new L.Icon({
    iconUrl: 'https://cdn0.iconfinder.com/data/icons/new-normal-music-festival-2/512/28.Placeholder-512.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  archaeological_site: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2282/2282197.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
};


// Component to handle map initialization and size invalidation
const MapInitializer = () => {
  const map = useMap();
  const mapInitialized = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (map && !mapInitialized.current) {
      timeoutRef.current = setTimeout(() => {
        if (map && map._container) {
          try {
            map.invalidateSize();
            mapInitialized.current = true;
          } catch (error) {
            console.error('Error invalidating map size:', error);
          }
        }
      }, 500);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
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
  const { saving: historySaving, saveError: historySaveError } = useSelector(
    (state) => state.circuitHistory || {}
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
  const [showHistoryDuplicateDialog, setShowHistoryDuplicateDialog] = useState(false);
  const [existingCircuitId, setExistingCircuitId] = useState(null);
  const isMounted = useRef(true);
    const [expandedDays, setExpandedDays] = useState({});


  useEffect(() => {
    isMounted.current = true;
    dispatch(fetchDestinations());
    dispatch(fetchCuisines());
    dispatch(fetchActivityCategories());
    dispatch(clearEntities());

    return () => {
      isMounted.current = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (step === 4 && isMounted.current) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setIsMapVisible(true);
        }
      }, 600);
      return () => {
        clearTimeout(timer);
        setIsMapVisible(false);
      };
    } else {
      setIsMapVisible(false);
    }
  }, [step]);

  const getTotalDays = useCallback(() => {
    if (!formData.departure_date || !formData.arrival_date) return 0;
    const depDate = new Date(formData.departure_date);
    const arrDate = new Date(formData.arrival_date);
    const diffDays = Math.ceil((arrDate - depDate) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
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
      const days = Math.ceil((arrDate - depDate) / (1000 * 60 * 60 * 24)) + 1;
      if (days < 2) {
        newErrors.dates = 'Circuit duration must be at least 2 days';
      }
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
          ? `Le total des jours (${selectedDays}) doit correspondre à la durée du voyage (${totalDays})`
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
                image: data.image,
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

  const handleConfirmSaveToHistory = async () => {
    setShowHistoryDuplicateDialog(false);
    try {
      const circuitHistoryData = {
        circuit: formData.circuit.id,
        departure_date: formData.departure_date,
        arrival_date: formData.arrival_date,
      };
      console.log('Saving circuit history with data:', circuitHistoryData);
      await dispatch(saveCircuitToHistory(circuitHistoryData));

      setTimeout(() => {
        if (isMounted.current) {
          navigate(`/circuit/summary/${formData.circuit.id}`);
        }
      }, 100);
    } catch (error) {
      setErrors({
        api: error.message || 'Failed to save circuit to history. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSaveToHistory = () => {
    setShowHistoryDuplicateDialog(false);
    setTimeout(() => {
      if (isMounted.current) {
        navigate(`/circuit/summary/${formData.circuit.id}`);
      }
    }, 100);
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

        // Resolve city names for departure and arrival cities
        const departureDest = destinations.find(
          (d) => d.id === parseInt(formData.departure_city)
        );
        const arrivalDest = destinations.find(
          (d) => d.id === parseInt(formData.arrival_city)
        );
        const departureCityName = departureDest?.name || 'Unknown';
        const arrivalCityName = arrivalDest?.name || 'Unknown';

        const circuitData = {
          name: `Circuit ${departureCityName} to ${arrivalCityName} ${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
        console.error('Error in handleNext (step 3):', error);
  console.error('Error response:', error.response);
  setErrors({
    api: error.response?.data?.detail || error.message || 'Failed to generate circuit. Please try again.',
  });
      }
    } else if (step === 4) {
      if (!formData.circuit?.id) {
        setErrors({ api: 'Circuit ID is missing. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      try {
        const circuitHistoryData = {
          circuit: formData.circuit.id,
          departure_date: formData.departure_date,
          arrival_date: formData.arrival_date,
        };

        const historyCheck = await dispatch(checkCircuitHistoryDuplicate(circuitHistoryData));

        if (historyCheck.exists) {
          setShowHistoryDuplicateDialog(true);
          setIsSubmitting(false);
          return;
        }

        await handleConfirmSaveToHistory();
      } catch (error) {
        setErrors({
          api: error.message || 'Failed to check circuit history. Please try again.',
        });
        setIsSubmitting(false);
      }
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

const renderStep1 = () => {
  // Aujourd'hui est le 05 juin 2025 ; demain est le 06 juin 2025
  const tomorrow = "2025-06-06";

  const validateForm = () => {
    const newErrors = {};

    // Valider la date de départ (ne peut pas être avant demain)
    if (formData.departure_date && formData.departure_date < tomorrow) {
      newErrors.departure_date = `La date de départ ne peut pas être avant demain (${tomorrow}).`;
    }

    // Valider le budget
    if (formData.budget !== "") {
      const budgetValue = parseFloat(formData.budget);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        newErrors.budget = "Le budget doit être un nombre supérieur à 0.";
      }
    }

    // Valider les étoiles (uniquement si l'hébergement est 'hôtel')
    if (formData.accommodation === "hôtel" && formData.stars !== "") {
      const starsValue = parseInt(formData.stars, 10);
      if (starsValue < 1 || starsValue > 5) {
        newErrors.stars = "Les étoiles doivent être entre 1 et 5.";
      }
    }

    // Valider les fourchettes
    if (formData.forks !== "") {
      const forksValue = parseInt(formData.forks, 10);
      if (forksValue < 1 || forksValue > 3) {
        newErrors.forks = "Les fourchettes doivent être entre 1 et 3.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Déclencher la validation après chaque changement
    validateForm();
  };

  // Fonction pour gérer la sélection des étoiles
  const handleStarsChange = (value) => {
    handleInputChange('stars', value.toString());
  };

  // Fonction pour gérer la sélection des fourchettes
  const handleForksChange = (value) => {
    handleInputChange('forks', value.toString());
  };

  // Fonction pour gérer les checkboxes des cuisines
  const handleCuisineChange = (cuisineId) => {
    const updatedCuisines = formData.cuisines.includes(cuisineId)
      ? formData.cuisines.filter((id) => id !== cuisineId)
      : [...formData.cuisines, cuisineId];
    handleInputChange('cuisines', updatedCuisines);
  };

  // Fonction pour gérer les checkboxes des catégories d'activités
  const handleActivityChange = (categoryId) => {
    const updatedActivities = formData.activities.includes(categoryId)
      ? formData.activities.filter((id) => id !== categoryId)
      : [...formData.activities, categoryId];
    handleInputChange('activities', updatedActivities);
  };

  // Organiser les cuisines et activités en colonnes (3 colonnes)
  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const cuisineColumns = chunkArray(cuisines, Math.ceil(cuisines.length / 3));
  const activityColumns = chunkArray(activityCategories, Math.ceil(activityCategories.length / 3));

  // Nouvelle fonction pour filtrer les entrées non numériques dans le budget
  const handleBudgetKeyPress = (e) => {
    const charCode = e.which ? e.which : e.keyCode;
    // Autoriser les chiffres (0-9) et certaines touches de contrôle (backspace, delete, etc.)
    if (
      (charCode < 48 || charCode > 57) &&
      charCode !== 8 && // Backspace
      charCode !== 46 && // Delete
      charCode !== 9 // Tab
    ) {
      e.preventDefault();
    }
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
          <img
            src="https://www.freeiconspng.com/thumbs/travel-icon-png/plane-travel-flight-tourism-travel-icon-png-10.png"
            alt="Planification de voyage"
          />
        </div>
        <div className="intro-text">
          <h1>Planifions votre voyage parfait !</h1>
          <p>
            <span className="step">Étape 1 :</span> Indiquez vos{' '}
            <strong>préférences</strong> pour créer un circuit de voyage personnalisé.
            Choisissez votre budget, type d’hébergement, options de restauration, et plus encore pour commencer.
          </p>
        </div>
      </div>

      <div className="step1-form">
        <div className="input-row">
          <div className="input-group">
            <label>Ville de départ</label>
            <select
              value={formData.departure_city}
              onChange={(e) =>
                handleInputChange('departure_city', e.target.value)
              }
            >
              <option value="">Sélectionnez une ville</option>
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
            <label>Ville d'arrivée</label>
            <select
              value={formData.arrival_city}
              onChange={(e) =>
                handleInputChange('arrival_city', e.target.value)
              }
            >
              <option value="">Sélectionnez une ville</option>
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
            <label>Date de départ</label>
            <input
              type="date"
              value={formData.departure_date}
              min={tomorrow} // Restreindre les dates avant demain (06/06/2025)
              onChange={(e) =>
                handleInputChange('departure_date', e.target.value)
              }
            />
            {errors.departure_date && (
              <p className="text-red-500 text-sm mt-1">{errors.departure_date}</p>
            )}
          </div>
          <div className="input-group">
            <label>Date d'arrivée</label>
            <input
              type="date"
              value={formData.arrival_date}
              min={formData.departure_date || tomorrow}
              onChange={(e) =>
                handleInputChange('arrival_date', e.target.value)
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
              min="1" // Empêcher les nombres non positifs
              value={formData.budget}
              onChange={(e) =>
                handleInputChange('budget', e.target.value)
              }
              onKeyPress={handleBudgetKeyPress} // Filtrer les entrées non numériques
              pattern="[0-9]*" // Contrainte HTML pour accepter uniquement des chiffres
              placeholder="Entrez votre budget"
            />
            {errors.budget && (
              <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
            )}
          </div>
          <div className="input-group">
            <label>Type d'hébergement</label>
            <select
              value={formData.accommodation}
              onChange={(e) =>
                handleInputChange('accommodation', e.target.value)
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
              <div className="label-rating-container">
                <label>Étoiles</label>
                <div className="rating-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fas fa-star rating-icon ${parseInt(formData.stars) >= star ? 'filled' : ''}`}
                      onClick={() => handleStarsChange(star)}
                      aria-label={`Sélectionner ${star} étoile${star > 1 ? 's' : ''}`}
                    ></i>
                  ))}
                </div>
              </div>
              {errors.stars && (
                <p className="text-red-500 text-sm mt-1">{errors.stars}</p>
              )}
            </div>
          )}
          {formData.accommodation === "maison d'hôte" && (
            <div className="input-group">
              <label>Catégorie de maison d'hôte</label>
              <select
                value={formData.guest_house_category}
                onChange={(e) =>
                  handleInputChange('guest_house_category', e.target.value)
                }
              >
                <option value="">Sélectionnez une catégorie</option>
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
              <div className="label-rating-container">
                <label>Fourchettes (Note du restaurant)</label>
                <div className="rating-container">
                  {[1, 2, 3].map((fork) => (
                    <i
                      key={fork}
                      className={`fas fa-utensils rating-icon ${parseInt(formData.forks) >= fork ? 'filled' : ''}`}
                      onClick={() => handleForksChange(fork)}
                      aria-label={`Sélectionner ${fork} fourchette${fork > 1 ? 's' : ''}`}
                    ></i>
                  ))}
                </div>
              </div>
              {errors.forks && (
                <p className="text-red-500 text-sm mt-1">{errors.forks}</p>
              )}
            </div>
          )}
          {formData.accommodation !== 'hôtel' &&
            formData.accommodation !== "maison d'hôte" && (
              <div className="input-group">
                <div className="label-rating-container">
                  <label>Fourchettes (Note du restaurant)</label>
                  <div className="rating-container">
                    {[1, 2, 3].map((fork) => (
                      <i
                        key={fork}
                        className={`fas fa-utensils rating-icon ${parseInt(formData.forks) >= fork ? 'filled' : ''}`}
                        onClick={() => handleForksChange(fork)}
                        aria-label={`Sélectionner ${fork} fourchette${fork > 1 ? 's' : ''}`}
                      ></i>
                    ))}
                  </div>
                </div>
                {errors.forks && (
                  <p className="text-red-500 text-sm mt-1">{errors.forks}</p>
                )}
              </div>
            )}
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Cuisines</label>
            <div className="checkbox-grid">
              {cuisineColumns.map((column, colIndex) => (
                <div key={colIndex} className="checkbox-column">
                  {column.map((cuisine) => (
                    <div key={cuisine.id} className="checkbox-option">
                      <div className="cntr">
                        <input
                          type="checkbox"
                          id={`cuisine-${cuisine.id}`}
                          className="hidden-xs-up"
                          checked={formData.cuisines.includes(cuisine.id)}
                          onChange={() => handleCuisineChange(cuisine.id)}
                        />
                        <label className="cbx" htmlFor={`cuisine-${cuisine.id}`}></label>
                        <label className="lbl" htmlFor={`cuisine-${cuisine.id}`}>
                          {cuisine.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {errors.cuisines && (
              <p className="text-red-500 text-sm mt-1">{errors.cuisines}</p>
            )}
          </div>
          <div className="input-group">
            <label>Catégories d'activités</label>
            <div className="checkbox-grid">
              {activityColumns.map((column, colIndex) => (
                <div key={colIndex} className="checkbox-column">
                  {column.map((category) => (
                    <div key={category.id} className="checkbox-option">
                      <div className="cntr">
                        <input
                          type="checkbox"
                          id={`activity-${category.id}`}
                          className="hidden-xs-up"
                          checked={formData.activities.includes(category.id)}
                          onChange={() => handleActivityChange(category.id)}
                        />
                        <label className="cbx" htmlFor={`activity-${category.id}`}></label>
                        <label className="lbl" htmlFor={`activity-${category.id}`}>
                          {category.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {errors.activities && (
              <p className="text-red-500 text-sm mt-1">{errors.activities}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const renderStep2 = () => {
  const totalDays = getTotalDays();
  const selectedDays = formData.destinations.reduce(
    (sum, dest) => sum + (dest.days || 0),
    0
  );
  const { isValid, error } = validateStep2();

  // Mapping of destinations to image URLs
  const destinationImages = {
    tunis: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOgrLpKPYmLYnPHgYnCZX7SlNfyMn0hsfL1Q&s",
    ariana: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXJ6J3fOqLUTjp3KLXVKyJpt_aze7IosEguA&s",
    béja: "https://hraier.com/wp-content/uploads/2023/04/Beja-Tunisie-Guide-complet-et-informations.jpeg",
    "ben arous": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/04/a4/8b/suite--v2419129.jpg?w=600&h=400&s=1",
    bizerte: "https://guide-voyage-tunisie.com/wp-content/uploads/2022/12/vieux-port-de-bizerte6-1.webp",
    gabès: "https://wildyness.com/uploads/0000/145/2022/01/04/gabes-600.jpg",
    gafsa: "https://polegafsa.com.tn/wp-content/uploads/2021/11/webElbayGafsaTourism.jpg",
    jendouba: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcTuYcJAMplb0cFJiTs5EUQXuZI8L_TMqoZtag&s",
    kairouan: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcTKWyVp0mOKuU9hm0F4kUqJjQFGokH4hpEW8w&s",
    kasserine: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcQ2euHSHQqWYtZGqG3TTSxTFviDcYvBfwDjdA&s",
    kébili: "https://blog.tunisiebooking.com/wp-content/uploads/2020/12/kebili-1-960x720.jpg",
    "le kef": "https://upload.wikimedia.org/wikipedia/commons/c/ca/El_Kef%27s_casbah.jpg",
    mahdia: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcSgXhJqvys350y_x5qS1oLdZQhmqmbdlsgQ2A&s",
    "la manouba": "https://www.iri.org/wp-content/uploads/2022/04/TunisRooftops.jpg?w=2000",
    médenine: "https://guide-voyage-tunisie.com/wp-content/uploads/2022/12/hotel-restaurant-ksar-jouamaa.webp",
    monastir: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcT8aikO3tFPm4ghf-13lHowcHxmeSDZlNuhmA&s",
    nabeul: "https://encrypted-tbn0.gstatic.com/images?q=tbn9GcQqpz-oGmbuxkvY5FzO2Z3VNmw208YaM4AfyQ&s",
    sfax: "https://www.tunisi.info/wp-content/uploads/2024/07/tunisia-medina-sfax.jpg",
    "sidi bouzid": "https://www.tunisienumerique.com/wp-content/uploads/2021/02/sidi-bouzid-.jpg",
    siliana: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/b4/f5/79/maktaris.jpg?w=400&h=300&s=1",
    sousse: "https://www.infotunisie.com/wp-content/uploads/2017/08/sousse.jpg",
    tozeur: "https://voyage-tunisie.info/wp-content/uploads/2017/10/Tamerza-nature-800x500.jpg",
    zaghouan: "https://voyage-tunisie.info/wp-content/uploads/2017/12/Zaghouan3-1-800x500.jpg",
    tataouine: "https://voyage-tunisie.info/wp-content/uploads/2017/11/Tataouine-troglodites.jpg",
  };

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

  const updateDays = (destId, change) => {
    setFormData((prevFormData) => {
      const newDestinations = prevFormData.destinations.map((dest) =>
        dest.id === destId
          ? { ...dest, days: Math.max(1, (dest.days || 1) + change) }
          : dest
      );
      return { ...prevFormData, destinations: newDestinations };
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
          <img src="https://static.vecteezy.com/system/resources/previews/022/556/384/non_2x/the-concept-of-a-plan-with-an-easy-route-a-a-difficult-option-b-and-a-real-life-way-expectation-and-reality-png.png" alt="Planification d'itinéraire" />
        </div>
        <div className="intro-text">
          <h1>Concevez votre itinéraire de voyage</h1>
          <p>
            <span className="step">Étape 2 :</span> Sélectionnez vos{' '}
            <strong>destinations</strong> et attribuez le nombre de jours pour chaque étape.
            Assurez-vous que le total corresponde à la durée de votre voyage de{' '}
            <strong>{totalDays} jours</strong>.
          </p>
        </div>
      </div>

      <div className="step2-form">
        <p
          className={`text-gray-600 ${
            selectedDays === totalDays ? 'text-green-600' : 'text-red-600'
          }`}
        >
          Total des jours actuels : {selectedDays} / {totalDays}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ajouter une destination intermédiaire
          </label>
          <select
            onChange={(e) => addDestination(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Sélectionnez une destination</option>
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
          <h3 className="text-xl font-semibold text-gray-700">Attribuer les jours</h3>
          <div className="mt-4 space-y-4">
            {formData.destinations.map((dest) => {
              const destNameLower = dest.name.toLowerCase();
              const imageSrc = destinationImages[destNameLower] || "https://via.placeholder.com/40"; // Fallback image

              return (
                <div
                  key={dest.id}
                  className="destination-card flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  {/* Left Section: Image and Name */}
                  <div className="flex items-center space-x-3 w-1/3">
                    <img
                      src={imageSrc}
                      alt={`${dest.name} image`}
                      className="destination-image"
                    />
                    <span className="text-gray-700 font-medium">
                      {dest.id === parseInt(formData.departure_city)
                        ? '[Départ] '
                        : dest.id === parseInt(formData.arrival_city)
                        ? '[Arrivée] '
                        : ''}
                      {dest.name}
                    </span>
                  </div>

                  {/* Center Section: Supprimer Button */}
                  <div className="w-1/3 flex justify-center">
                    {!(dest.id === parseInt(formData.departure_city) || dest.id === parseInt(formData.arrival_city)) && (
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            destinations: formData.destinations.filter(
                              (d) => d.id !== dest.id
                            ),
                          })
                        }
                        className="supprimer-button"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  {/* Right Section: Day Input */}
                  <div className="w-1/3 flex justify-end">
                    <div className="day-input-container">
                      <span className="day-label">Nombre de jours</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateDays(dest.id, -1)}
                          className="day-button"
                          aria-label="decrease nombre days selected"
                        >
                          -
                        </button>
                        <span className="day-value">{dest.days || 1}</span>
                        <button
                          onClick={() => updateDays(dest.id, 1)}
                          className="day-button"
                          aria-label="increase nombre days selected"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    </motion.div>
  );
};

  const renderStep4 = () => {
  const circuit = formData.circuit || {
    orderedDestinations: formData.destinations.map((d) => ({
      id: d.id,
      name: d.name || destinations.find((dd) => dd.id === d.id)?.name || 'Inconnu',
      days: d.days || 1,
      latitude: destinations.find((dd) => dd.id === d.id)?.latitude || 36.8065,
      longitude: destinations.find((dd) => dd.id === d.id)?.longitude || 10.1815,
    })),
  };
  const totalDays = getTotalDays();
  const nights = totalDays - 1;

  const originDest = destinations.find(
    (d) => d.id === parseInt(formData.departure_city)
  ) || { name: 'Inconnu', latitude: 36.8065, longitude: 10.1815 };
  const destinationDest = destinations.find(
    (d) => d.id === parseInt(formData.arrival_city)
  ) || { name: 'Inconnu', latitude: 36.8065, longitude: 10.1815 };

  const orderedDestinations = circuit.orderedDestinations.map((dest) => {
    const destination = destinations.find((d) => d.id === dest.id) || {
      latitude: 36.8065,
      longitude: 10.1815,
      name: dest.name || 'Inconnu',
    };
    return {
      ...dest,
      latitude: destination.latitude || 36.8065,
      longitude: destination.longitude || 10.1815,
    };
  }).filter(
    (dest) =>
      dest.latitude && dest.longitude && !isNaN(dest.latitude) && !isNaN(dest.longitude)
  );

  const waypoints = orderedDestinations
    .map((dest, index) => {
      if (!dest.latitude || !dest.longitude || isNaN(dest.latitude) || isNaN(dest.longitude))
        return null;
      return {
        lat: dest.latitude,
        lng: dest.longitude,
        name: `${dest.name}${
          index === 0
            ? ' (Départ)'
            : index === orderedDestinations.length - 1
            ? ' (Arrivée)'
            : ''
        }`,
      };
    })
    .filter((point) => point !== null);

  // Collect entity markers
  const entityMarkers = [];
  orderedDestinations.forEach((dest, destIndex) => {
    // Collect all entities for this destination across all days
    const allEntities = {};
    for (let day = 1; day <= dest.days; day++) {
      const dayEntities = formData.selectedEntities[dest.id]?.[day] || {};
      Object.keys(dayEntities).forEach((key) => {
        if (dayEntities[key]) {
          if (!allEntities[key]) allEntities[key] = [];
          allEntities[key].push(dayEntities[key]);
        }
      });
    }

    const entityTypes = [
      'hotel',
      'guest_house',
      'restaurant',
      'activity',
      'museum',
      'festival',
      'archaeological_site',
    ];

    entityTypes.forEach((entityType) => {
      const entitiesOfType = allEntities[entityType] || [];
      entitiesOfType.forEach((entity, idx) => {
        let lat = entity.latitude || dest.latitude;
        let lng = entity.longitude || dest.longitude;

        if (!entity.latitude || !entity.longitude) {
          const offset = 0.005 * (entityMarkers.length % 5);
          const angle = (entityMarkers.length % 5) * (Math.PI / 2);
          lat += offset * Math.cos(angle);
          lng += offset * Math.sin(angle);
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          entityMarkers.push({
            lat,
            lng,
            type: entityType,
            name: entity.name,
            address: entity.address || 'N/A',
            day: destIndex + 1, // Use order as "day" for markers
            icon: entityIcons[entityType],
          });
        }
      });
    });
  });

  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : defaultCenter;

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
                      Jour {index + 1} sur {waypoints.length}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {entityMarkers.map((marker, index) => (
              <Marker key={`entity-${index}`} position={[marker.lat, marker.lng]} icon={marker.icon}>
                <Popup>
                  <div className="text-center">
                    <strong>{marker.name}</strong>
                    <p>{marker.type.replace('_', ' ').toUpperCase()}</p>
                    <p>Jour {marker.day}</p>
                    <p>{marker.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}
          </MapContainer>
        ) : (
          <p className="text-center text-gray-500 pt-40">
            {isMapVisible
              ? `Impossible d’afficher la carte : au moins une destination avec des coordonnées valides est nécessaire. (Nombre de waypoints : ${waypoints.length})`
              : 'Chargement de la carte...'}
          </p>
        )}
      </div>

      <div className="w-full md:w-3/5 space-y-6 overflow-y-auto md:max-h-[600px]">
        <div className="container p-3.5 lg:px-16 xl:px-16 mx-auto my-2">
          <div className="flex flex-row items-center">
            <h1 className="font-bold text-md mr-1">
              Circuit {originDest.name}-{destinationDest.name}
            </h1>
            <span className="text-sm text-gray-600">
              {totalDays} Jour(s) / {nights} Nuit(s)
            </span>
          </div>
          <div className="mt-2">
            {orderedDestinations.length === 0 ? (
              <p className="text-gray-500">Aucune destination disponible à afficher.</p>
            ) : (
              <>
                {orderedDestinations.map((dest, destIndex) => {
                  // Collect all entities for this destination across all days
                  const allEntities = {};
                  for (let day = 1; day <= dest.days; day++) {
                    const dayEntities = formData.selectedEntities[dest.id]?.[day] || {};
                    Object.keys(dayEntities).forEach((key) => {
                      if (dayEntities[key]) {
                        if (!allEntities[key]) allEntities[key] = [];
                        allEntities[key].push(dayEntities[key]);
                      }
                    });
                  }

                  const hotel =
                    formData.accommodation === 'hôtel'
                      ? allEntities.hotel?.[0]
                      : allEntities.guest_house?.[0];
                  const restaurant = allEntities.restaurant?.[0];
                  const activity =
                    allEntities.activity?.[0] ||
                    allEntities.museum?.[0] ||
                    allEntities.festival?.[0] ||
                    allEntities.archaeological_site?.[0];

                  const isExpanded = expandedDays[`${dest.id}`] || false;

                  const toggleExpand = () => {
                    setExpandedDays((prev) => ({
                      ...prev,
                      [`${dest.id}`]: !prev[`${dest.id}`],
                    }));
                  };

                  return (
                    <div
                      key={dest.id}
                      className="p-4 bg-white rounded-lg shadow-md border border-gray-200 relative mb-4"
                      style={{ transform: 'scale(1) translateZ(0px)', opacity: 1 }}
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="ml-3 text-lg font-semibold">
                          Jour {destIndex + 1} - {dest.name}
                        </h2>
                        <button
                          onClick={toggleExpand}
                          className="w-8 h-8 flex items-center justify-center text-white rounded-full bg-blue hover:bg-[#2C5BA1]"
                        >
                          <span>
                            <i className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'}`}></i>
                          </span>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 text-sm text-gray-600">
                          {/* Hôtels */}
                          {hotel && (
                            <>
                              <h1 className="text-blue font-bold text-lg ltr:text-left my-2">
                                Hôtels
                              </h1>
                              <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                <div className="grid grid-cols-4">
                                  <div
                                    className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                    style={{
                                      backgroundImage: `url(${hotel.image || 'https://via.placeholder.com/318x160'})`,
                                      backgroundPosition: 'center center',
                                      backgroundRepeat: 'no-repeat',
                                    }}
                                  />
                                  <div className="col-span-3">
                                    <div className="flex flex-col justify-between p-4">
                                      <div className="flex flex-col">
                                        <h3 className="font-semibold text-lg flex items-start">
                                          <span>{hotel.name}</span>
                                        </h3>
                                      </div>
                                      <div className="bg-yellow-100 border-l-4 text-xs border-yellow-500 text-yellow-700 p-1 rounded">
                                        <p>Cet hôtel n'est pas réservable.</p>
                                      </div>
                                      <div className="flex justify-between">
                                        <div className="flex items-end">
                                          <div className="flex flex-col">
                                            <div className="flex items-center text-gray-600 text-sm">
                                              <i className="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                                              <span>{hotel.address || 'Adresse non disponible'}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="">
                                            <p className="text-xs text-gray-500">à partir de</p>
                                            <span className="text-blue font-bold text-xl">
                                              {hotel.price || 'N/A'}<sup> DT</sup>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <hr className="my-2" />
                            </>
                          )}

                          {/* Restaurants */}
                          {restaurant && (
                            <>
                              <h1 className="text-blue font-bold text-lg ltr:text-left my-2">
                                Restaurants
                              </h1>
                              <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                <div className="grid grid-cols-4">
                                  <div
                                    className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                    style={{
                                      backgroundImage: `url(${restaurant.image || 'https://via.placeholder.com/318x160'})`,
                                      backgroundPosition: 'center center',
                                      backgroundRepeat: 'no-repeat',
                                    }}
                                  />
                                  <div className="col-span-3">
                                    <div className="flex flex-col justify-between p-4">
                                      <div className="flex flex-row justify-between">
                                        <h3 className="font-semibold text-lg flex items-start">
                                          <span>{restaurant.name}</span>
                                        </h3>
                                      </div>
                                      <div className="bg-yellow-100 text-xs border-l-4 border-yellow-500 text-yellow-700 p-1 rounded">
                                        <p>Ce restaurant n'est pas réservable.</p>
                                      </div>
                                      <div className="flex justify-between">
                                        <div className="flex items-end">
                                          <div className="flex items-center text-gray-600 text-sm">
                                            <i className="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                                            <span>{restaurant.address || 'Adresse non disponible'}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="mb-1">
                                            <p className="text-xs text-gray-500">à partir de</p>
                                            <span className="text-blue-500 font-bold text-xl">
                                              {restaurant.price || 'N/A'}<sup> DT</sup>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <hr className="my-2" />
                            </>
                          )}

                          {/* Activités */}
                          {(allEntities.activity || allEntities.festival || allEntities.archaeological_site) && (
                            <>
                              <h1 className="text-blue text-lg font-bold ltr:text-left my-2">
                                Activités
                              </h1>
                              {allEntities.activity && allEntities.activity.map((activity, idx) => (
                                <div key={`activity-${idx}`} className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                  <div className="grid grid-cols-4">
                                    <div
                                      className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                      style={{
                                        backgroundImage: `url(${activity.image || 'https://via.placeholder.com/318x193'})`,
                                        backgroundPosition: 'center center',
                                        backgroundRepeat: 'no-repeat',
                                      }}
                                    />
                                    <div className="col-span-3">
                                      <div className="flex flex-col justify-between p-4">
                                        <div className="flex flex-col">
                                          <h3 className="font-semibold text-lg flex items-start">
                                            {activity.name}
                                          </h3>
                                        </div>
                                        <div className="flex justify-between">
                                          <div className="flex items-end">
                                            <div className="flex items-center text-gray-600 text-sm">
                                              <i className="fas fa-map-marker-alt text-blue-500 mr-1 truncate"></i>
                                              <span>{activity.address || 'Lieu non précisé'}</span>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="">
                                              <i className="fas fa-user text-blue mr-1"></i>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {allEntities.festival && allEntities.festival.map((festival, idx) => (
                                <div key={`festival-${idx}`} className="mt-2">
                                  <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                    <div className="grid grid-cols-4">
                                      <div
                                        className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                        style={{
                                          backgroundImage: `url(${festival.image || 'https://via.placeholder.com/318x193'})`,
                                          backgroundPosition: 'center center',
                                          backgroundRepeat: 'no-repeat',
                                        }}
                                      />
                                      <div className="col-span-3">
                                        <div className="flex flex-col justify-between p-4">
                                          <div className="flex flex-col">
                                            <h3 className="font-semibold text-lg flex items-start">
                                              {festival.name}
                                            </h3>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="flex items-end">
                                              <div className="flex items-center text-gray-600 text-sm">
                                                <i className="fas fa-map-marker-alt text-blue-500 mr-1 truncate"></i>
                                                <span>{festival.address || 'Lieu non précisé'}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <div className="">
                                                <i className="fas fa-user text-blue mr-1"></i>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {allEntities.archaeological_site && allEntities.archaeological_site.map((site, idx) => (
                                <div key={`site-${idx}`} className="mt-2">
                                  <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                    <div className="grid grid-cols-4">
                                      <div
                                        className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                        style={{
                                          backgroundImage: `url(${site.image || 'https://via.placeholder.com/318x193'})`,
                                          backgroundPosition: 'center center',
                                          backgroundRepeat: 'no-repeat',
                                        }}
                                      />
                                      <div className="col-span-3">
                                        <div className="flex flex-col justify-between p-4">
                                          <div className="flex flex-col">
                                            <h3 className="font-semibold text-lg flex items-start">
                                              {site.name}
                                            </h3>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="flex items-end">
                                              <div className="flex items-center text-gray-600 text-sm">
                                                <i className="fas fa-map-marker-alt text-blue-500 mr-1 truncate"></i>
                                                <span>{site.address || 'Lieu non précisé'}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <div className="">
                                                <i className="fas fa-user text-blue mr-1"></i>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <hr className="my-2" />
                            </>
                          )}

                          {/* Musées */}
                          {allEntities.museum && (
                            <>
                              <h1 className="text-blue text-lg font-bold ltr:text-left my-2">
                                Musées
                              </h1>
                              {allEntities.museum.map((museum, idx) => (
                                <div key={`museum-${idx}`} className="group relative bg-white border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full cursor-pointer">
                                  <div className="flex flex-col sm:flex-row h-full">
                                    <div className="sm:w-1/3 h-32 sm:h-full relative overflow-hidden">
                                      <img
                                        src={museum.image || 'https://via.placeholder.com/405x195'}
                                        alt={`${museum.name}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                    </div>
                                    <div className="sm:w-2/3 p-4 flex flex-col h-full">
                                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                                        <span>{museum.name}</span>
                                      </h3>
                                      <div className="flex items-center text-gray-600 mb-3">
                                        <i className="fas fa-map-marker-alt text-blue-500 mr-2 text-sm sm:text-base"></i>
                                        <span className="text-sm sm:text-base">
                                          {museum.address || 'Lieu non précisé'}
                                        </span>
                                      </div>
                                      <div className="mt-auto">
                                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                                          <div className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm sm:text-base">
                                            <i className="fas fa-money-bill-wave mr-2"></i>
                                            <span className="font-medium">
                                              {museum.price || 'Gratuit'}
                                            </span>
                                          </div>
                                          <div className="flex items-center bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm sm:text-base">
                                            <i className="fas fa-info-circle mr-2"></i>
                                            <span>
                                              {museum.exhibition || 'Informations non disponibles'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex flex-row justify-end items-end mt-2">
                  <button
                    onClick={handleNext}
                    aria-label="Confirmer circuit"
                    className="bg-[#F78D1E] py-2 px-4 rounded-2xl mt-2 text-md text-white"
                  >
                    Confirmer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
  return (
    <>
    <HeroSection
      title="Plan Your Perfect Trip"
      subtitle="Set your preferences to start your journey"
      image="https://www.parasympathique.com/wp-content/uploads/2022/05/le-circuit-touristique-quels-avantages-1038x576.jpg" // You can use a different image if needed
    />
    <div className="max-w-7xl mx-auto p-6">
      
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
      {historySaveError && (
        <p className="text-red-500 mb-4">Error saving circuit to history: {historySaveError}</p>
      )}
      {circuitLoading || historySaving ? (
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
                  remainingBudget={formData.budget ? parseFloat(formData.budget) - calculateEntityPrice() : Infinity}
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
      Circuit dupliqué détecté
    </h3>
    <p className="text-gray-600 mb-6">
      Un circuit similaire existe déjà. Souhaitez-vous consulter le circuit existant ou en créer un nouveau ?
    </p>
    <div className="flex justify-end space-x-4">
      <button
        onClick={handleViewExistingCircuit}
        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
      >
        Consulter l'existant
      </button>
      <button
        onClick={handleProceedWithNewCircuit}
        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
      >
        Créer un nouveau
      </button>
    </div>
  </div>
</div>
      )}
      {showHistoryDuplicateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Circuit History Duplicate Found
            </h3>
            <p className="text-gray-600 mb-6">
              This circuit has already been saved to your history with the same dates. Do you want to save it again?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSaveToHistory}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                No
              </button>
              <button
                onClick={handleConfirmSaveToHistory}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {errors.api && (
        <p className="text-red-500 mt-4">{errors.api}</p>
      )}
      <div className="mt-8 flex justify-between">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Retour
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className={`px-6 py-2 ${
            isSubmitting ? 'bg-indigo-300' : 'bg-indigo-500 hover:bg-indigo-600'
          } text-white rounded-md transition-colors`}
        >
          {isSubmitting
            ? 'Processing...'
            : step === 4
            ? 'Save & View Summary'
            : 'Suivant'}
        </button>
      </div>
    </div>
    </>
  );
};

export default CircuitWizard;