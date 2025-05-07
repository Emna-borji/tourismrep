import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCircuitDetails } from '../redux/actions/circuitActions';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
          const routeLayer = L.polyline(routeCoordinates, {
            color: '#1E90FF',
            weight: 5,
            opacity: 0.7,
          }).addTo(map);

          const bounds = L.latLngBounds(routeCoordinates);
          map.fitBounds(bounds, { padding: [50, 50] });

          const fallbackLine = L.polyline(
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

const CircuitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { circuit, loading, error } = useSelector((state) => state.circuit);

  const [isMapVisible, setIsMapVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchCircuitDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapVisible(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="text-center text-gray-600 p-6">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-6">Error: {error}</div>;
  if (!circuit) return <div className="text-center text-gray-500 p-6">No circuit found.</div>;

  // Calculate total days and nights
  const totalDays = circuit.duration || 1;
  const nights = totalDays - 1;

  // Extract origin and destination names
  const originDestName = typeof circuit.departure_city === 'string' 
    ? circuit.departure_city 
    : circuit.departure_city?.name || 'Unknown';
  const destinationDestName = typeof circuit.arrival_city === 'string' 
    ? circuit.arrival_city 
    : circuit.arrival_city?.name || 'Unknown';

  // Prepare ordered destinations from schedules
  const orderedDestinations = (circuit.schedules || []).map((schedule) => ({
    id: schedule.destination_id,
    name: schedule.destination_name || 'Unknown',
    days: schedule.day || 1,
    latitude: schedule.destination?.latitude || 36.8065,
    longitude: schedule.destination?.longitude || 10.1815,
  })).filter(dest => dest.latitude && dest.longitude && !isNaN(dest.latitude) && !isNaN(dest.longitude));

  // Prepare waypoints for the map
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

  // Default map center if no waypoints are available
  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = waypoints.length > 0
    ? [waypoints[0].lat, waypoints[0].lng]
    : defaultCenter;

  // Prepare schedule data for display (similar to selectedEntities in CircuitWizard)
  const schedulesByDestination = {};
  (circuit.schedules || []).forEach((schedule) => {
    const destId = schedule.destination_id;
    const day = schedule.day;

    if (!schedulesByDestination[destId]) {
      schedulesByDestination[destId] = {};
    }
    if (!schedulesByDestination[destId][day]) {
      schedulesByDestination[destId][day] = {};
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
        schedulesByDestination[destId][day][type] = {
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

  let globalDay = 1;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
      >
        Retour
      </button>

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

        {/* Itinerary Section */}
        <div className="w-full md:w-1/2 space-y-6 overflow-y-auto md:max-h-[600px]">
          <h2 className="text-2xl font-bold text-gray-800">
            Circuit {originDestName} to {destinationDestName}: {totalDays} Day(s) / {nights} Night(s)
          </h2>
          {orderedDestinations.length === 0 ? (
            <p className="text-gray-500">No destinations available to display.</p>
          ) : (
            <>
              {orderedDestinations.map((dest) => (
                <React.Fragment key={dest.id}>
                  {Array.from({ length: dest.days }, (_, dayIndex) => {
                    const localDay = dayIndex + 1;
                    const entities = schedulesByDestination[dest.id]?.[localDay] || {};

                    const hotel = entities.hotel || entities.guest_house;
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

      {/* Summary Section (Sticky) */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md sticky bottom-4 max-w-sm mx-auto">
        <h3 className="text-lg font-semibold text-gray-800">Résumé</h3>
        <p className="text-gray-600">
          <strong>Prix:</strong> {circuit.price} DT /per
        </p>
        <p className="text-gray-600">
          <strong>Durée:</strong> {circuit.duration} jours
        </p>
        <button
          className="mt-4 w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
        >
          Réserver Maintenant
        </button>
      </div>
    </div>
  );
};

export default CircuitDetail;