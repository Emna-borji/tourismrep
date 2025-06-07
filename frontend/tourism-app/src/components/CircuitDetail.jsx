import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCircuitDetails } from '../redux/actions/circuitActions';
import { fetchDestinations } from '../redux/actions/destinationActions';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { fetchReviews, createReview } from '../redux/actions/reviewActions';
import EntityReviews from './EntityReviews';
import { Button, Form, Modal } from 'react-bootstrap';
import './circuitDetail.css';
import HeroSection from './Shared/HeroSection';

// Import Font Awesome for icons
import '@fortawesome/fontawesome-free/css/all.min.css';

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Define entity icons for the map markers
const entityIcons = {
  activity: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  restaurant: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4727/4727371.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  guest_house: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2976/2976243.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  hotel: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2921/2921845.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  museum: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2206/2206238.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  festival: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3652/3652195.png',
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

const MapInitializer = () => {
  const map = useMap();
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (map && !mapInitialized.current) {
      map.invalidateSize();
      mapInitialized.current = true;
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [map]);

  return null;
};

const RoutingMachine = ({ waypoints }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    console.log('Waypoints:', waypoints);

    if (!map || waypoints.length < 2) {
      console.log('Not enough waypoints to draw a route:', waypoints.length);
      return;
    }

    const initializeRouting = () => {
      if (!isMountedRef.current) return;

      map.eachLayer((layer) => {
        if (layer instanceof L.Routing.Control || layer instanceof L.Polyline) {
          try {
            map.removeLayer(layer);
          } catch (err) {
            console.warn('Error removing layer:', err);
          }
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
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        if (!isMountedRef.current) return;

        const routes = e.routes;
        console.log('Routes found:', routes);

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
        const fallbackLine = L.polyline(
          waypoints.map((point) => [point.lat, point.lng]),
          {
            color: 'red',
            weight: 3,
            opacity: 0.5,
            dashArray: '5, 10',
          }
        ).addTo(map);
      });

      routingControlRef.current = routingControl;
    };

    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initializeRouting();
      }
    }, 500);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);

      if (map) {
        if (routingControlRef.current) {
          try {
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
          } catch (err) {
            console.warn('Error removing routing control:', err);
          }
        }

        map.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            try {
              map.removeLayer(layer);
            } catch (err) {
              console.warn('Error removing polyline layer:', err);
            }
          }
        });
      }
    };
  }, [map, waypoints]);

  return null;
};

const CircuitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { circuit, loading, error } = useSelector((state) => state.circuit);
  const { destinations } = useSelector((state) => state.destinations || { destinations: [] });
  const { reviews, loading: reviewsLoading, error: reviewsError } = useSelector((state) => state.reviews);
  const { userInfo } = useSelector((state) => state.auth || {});

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    dispatch(fetchCircuitDetails(id));
    dispatch(fetchReviews('circuit', id));
    dispatch(fetchDestinations());
  }, [dispatch, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapVisible(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(createReview('circuit', id, { rating, comment, image }));
      setRating(0);
      setComment('');
      setImage(null);
      setShowReviewModal(false);
      dispatch(fetchReviews('circuit', id));
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  const toggleDay = (dayKey) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  if (loading) return <div className="text-center text-gray-600 p-6">Chargement...</div>;
  if (error) return <div className="text-center text-red-500 p-6">Erreur: {error}</div>;
  if (!circuit) return <div className="text-center text-gray-500 p-6">Aucun circuit trouvé.</div>;

  const totalDays = circuit.duration || 1;
  const nights = totalDays - 1;

  const departureDest = destinations.find((d) => d.id === parseInt(circuit.departure_city));
  const arrivalDest = destinations.find((d) => d.id === parseInt(circuit.arrival_city));
  const originDestName = departureDest?.name || 'Inconnu';
  const destinationDestName = arrivalDest?.name || 'Inconnu';

  const departureCoords = departureDest
    ? { lat: departureDest.latitude || 36.8065, lng: departureDest.longitude || 10.1815, name: `${originDestName} (Départ)` }
    : { lat: 36.8065, lng: 10.1815, name: 'Départ Inconnu' };
  const arrivalCoords = arrivalDest
    ? { lat: arrivalDest.latitude || 36.8065, lng: arrivalDest.longitude || 10.1815, name: `${destinationDestName} (Arrivée)` }
    : { lat: 36.8065, lng: 10.1815, name: 'Arrivée Inconnu' };

  const schedulesByDestination = {};
  (circuit.schedules || []).forEach((schedule) => {
    const destId = schedule.destination_id;
    if (!schedulesByDestination[destId]) {
      schedulesByDestination[destId] = [];
    }
    schedulesByDestination[destId].push(schedule);
  });

  Object.values(schedulesByDestination).forEach((schedules) => {
    schedules.sort((a, b) => a.order - b.order);
  });

  const orderedDestinations = Object.entries(schedulesByDestination).map(([destId, schedules]) => {
    const dest = destinations.find((d) => d.id === parseInt(destId)) || {};
    return {
      id: parseInt(destId),
      name: schedules[0].destination_name || dest.name || 'Inconnu',
      latitude: schedules[0].destination?.latitude || dest.latitude || 36.8065,
      longitude: schedules[0].destination?.longitude || dest.longitude || 10.1815,
      schedules: schedules,
    };
  });

  let waypoints = orderedDestinations
    .map((dest) => {
      if (isNaN(dest.latitude) || isNaN(dest.longitude)) {
        console.warn(`Invalid coordinates for destination ${dest.name}:`, dest);
        return null;
      }
      return {
        lat: dest.latitude,
        lng: dest.longitude,
        name: `${dest.name}`,
      };
    })
    .filter((point) => point !== null);

  if (!waypoints.some((wp) => wp.name.includes('Départ'))) {
    waypoints.unshift(departureCoords);
  }
  if (!waypoints.some((wp) => wp.name.includes('Arrivée'))) {
    waypoints.push(arrivalCoords);
  }

  console.log('Final Waypoints:', waypoints);

  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : defaultCenter;

  const entityMarkers = [];
  orderedDestinations.forEach((dest) => {
    dest.schedules.forEach((schedule) => {
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
          let lat = data.latitude || dest.latitude;
          let lng = data.longitude || dest.longitude;

          if (!data.latitude || !data.longitude) {
            const offset = 0.005 * (entityMarkers.length % 5);
            const angle = (entityMarkers.length % 5) * (Math.PI / 2);
            lat += offset * Math.cos(angle);
            lng += offset * Math.sin(angle);
          }

          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            entityMarkers.push({
              lat,
              lng,
              type: type,
              name: data.name,
              address: data.address || 'N/A',
              day: schedule.order,
              icon: entityIcons[type],
            });
          }
        }
      });
    });
  });

  console.log('Entity Markers:', entityMarkers);

  return (
    <>
      <div className="hero-container">
        <HeroSection
          title={`Circuit ${originDestName} à ${destinationDestName}`}
          subtitle={`Explorez un voyage de ${totalDays} jour(s) / ${nights} nuit(s)`}
          image={circuit.image || "https://lemag.promovacances.com/wp-content/uploads/2023/12/Circuit-3.jpg"}
        />
      </div>
      <div className="container p-3.5 lg:px-16 xl:px-16 mx-auto my-2">
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
          <div className="w-full md:w-1/2 h-96 circuit-wizard-map-container relative" style={{ zIndex: 0 }}>
            {isMapVisible && waypoints.length >= 1 ? (
              <MapContainer
                center={mapCenter}
                zoom={6}
                className="circuit-wizard-map rounded-lg w-full h-full"
                key={waypoints.map((p) => `${p.lat}-${p.lng}`).join('-')}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
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
                          Arrêt {index + 1} de {waypoints.length}
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
                  ? `Impossible d'afficher la carte : Besoin d'au moins une destination avec des coordonnées valides. (Nombre de waypoints : ${waypoints.length})`
                  : 'Chargement de la carte...'}
              </p>
            )}
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <div className="flex flex-row">
              <h1 className="font-bold text-md mr-1">
                Circuit {originDestName} to {destinationDestName}
              </h1>
              <span>{totalDays} Jour(s) / {nights} Nuit(s)</span>
            </div>
            {orderedDestinations.length === 0 ? (
              <p className="text-gray-500">Aucune destination disponible à afficher.</p>
            ) : (
              <>
                {orderedDestinations.map((dest) => (
                  <React.Fragment key={dest.id}>
                    {dest.schedules.map((schedule) => {
                      const entities = {
                        hotel: schedule.hotel,
                        guest_house: schedule.guest_house,
                        restaurant: schedule.restaurant,
                        activity: schedule.activity || schedule.museum || schedule.festival || schedule.archaeological_site,
                      };
                      const dayKey = `${dest.id}-${schedule.order}`;
                      const isExpanded = expandedDays[dayKey] || false;

                      return (
                        <div key={dayKey} className="p-4 bg-white rounded-lg shadow-md border border-gray-200 relative">
                          <div className="flex justify-between items-center">
                            <h2 className="ml-3 text-lg font-semibold">
                              Jour {schedule.order} - {dest.name}
                            </h2>
                            <button
                              onClick={() => toggleDay(dayKey)}
                              className="w-8 h-8 flex items-center justify-center text-white rounded-full bg-blue-500 hover:bg-[#2C5BA1]"
                            >
                              <span>
                                <i className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'}`}></i>
                              </span>
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {(entities.hotel || entities.guest_house) && (
                                <div>
                                  <h1 className="text-blue-500 font-bold text-lg ltr:text-left my-2">Hébergement</h1>
                                  <a className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                    <div className="grid grid-cols-4">
                                      <div
                                        className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                        style={{
                                          backgroundImage: `url(${(entities.hotel || entities.guest_house).image || 'https://via.placeholder.com/318x160'})`,
                                          backgroundPosition: 'center center',
                                          backgroundRepeat: 'no-repeat',
                                        }}
                                      />
                                      <div className="col-span-3">
                                        <div className="flex flex-col justify-between p-4">
                                          <div className="flex flex-col">
                                            <h3 className="font-semibold text-xs xl:text-lg flex items-start">
                                              <span>{(entities.hotel || entities.guest_house).name}</span>
                                            </h3>
                                            <div className="bg-yellow-100 border-l-4 text-xs border-yellow-500 text-yellow-700 p-1 rounded">
                                              <p>Cet hébergement n'est pas réservable.</p>
                                            </div>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="flex items-end">
                                              <div className="flex items-center text-gray-600 text-sm">
                                                <i className="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                                                <span>{(entities.hotel || entities.guest_house).address || 'N/A'}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-500">à partir de</p>
                                              <span className="text-blue-500 font-bold text-xl">
                                                {(entities.hotel || entities.guest_house).price != null ? (entities.hotel || entities.guest_house).price : 'N/A'}<sup> DT</sup>
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </a>
                                </div>
                              )}
                              {entities.restaurant && (
                                <div>
                                  <hr className="my-2" />
                                  <h1 className="text-blue-500 font-bold text-lg ltr:text-left my-2">Restaurants</h1>
                                  <div className="mt-2" style={{ backgroundColor: 'rgb(240, 246, 255)' }}>
                                    <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                      <div className="grid grid-cols-4">
                                        <div
                                          className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10"
                                          style={{
                                            backgroundImage: `url(${entities.restaurant.image || 'https://via.placeholder.com/318x160'})`,
                                            backgroundPosition: 'center center',
                                            backgroundRepeat: 'no-repeat',
                                          }}
                                        />
                                        <div className="col-span-3">
                                          <div className="flex flex-col justify-between p-4">
                                            <div className="flex flex-row justify-between">
                                              <h3 className="font-semibold text-lg flex items-start">
                                                <span>{entities.restaurant.name}</span>
                                              </h3>
                                            </div>
                                            <div className="bg-yellow-100 text-xs border-l-4 border-yellow-500 text-yellow-700 p-1 rounded">
                                              <p>Ce restaurant n'est pas réservable.</p>
                                            </div>
                                            <div className="flex justify-between">
                                              <div className="flex items-end">
                                                <div className="flex items-center text-gray-600 text-sm">
                                                  <i className="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                                                  <span>{entities.restaurant.address || 'N/A'}</span>
                                                </div>
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">à partir de</p>
                                                <span className="text-blue-500 font-bold text-xl">
                                                  {entities.restaurant.price != null ? entities.restaurant.price : 'N/A'}<sup> DT</sup>
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {entities.activity && (
                                <div>
                                  <hr className="my-2" />
                                  <h1 className="text-blue-500 font-bold text-lg ltr:text-left my-2">Activités</h1>
                                  <div className="mt-2" style={{ backgroundColor: 'rgb(240, 246, 255)' }}>
                                    <div className="block border group rounded-2xl overflow-hidden shadow-lg hover:cursor-pointer">
                                      <div className="grid grid-cols-4">
                                        <div
                                          className="col-span-1 relative w-full h-full bg-no-repeat bg-cover grow flex flex-col-reverse pb-6 lg:pb-10 transition duration-300 group-hover:scale-110"
                                          style={{
                                            backgroundImage: `url(${entities.activity.image || 'https://via.placeholder.com/318x160'})`,
                                            backgroundPosition: 'center center',
                                            backgroundRepeat: 'no-repeat',
                                          }}
                                        />
                                        <div className="col-span-3">
                                          <div className="flex flex-col justify-between p-4">
                                            <div className="flex flex-col">
                                              <h3 className="font-semibold text-lg flex items-start">
                                                <span>{entities.activity.name}</span>
                                              </h3>
                                            </div>
                                            <div className="flex justify-between">
                                              <div className="flex items-end">
                                                <div className="flex items-center text-gray-600 text-sm">
                                                  <i className="fas fa-map-marker-alt text-blue-500 mr-1 truncate"></i>
                                                  <span>{entities.activity.address || 'N/A'}</span>
                                                </div>
                                              </div>
                                              <div>
                                                {entities.activity.price != null && (
                                                  <>
                                                    <p className="text-xs text-gray-500">à partir de</p>
                                                    <span className="text-blue-500 font-bold text-xl">
                                                      {entities.activity.price}<sup> DT</sup>
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </>
            )}
            <div className="flex flex-row justify-end items-end mt-2">
              <button
                aria-label="Confirmer circuit"
                className="bg-[#F78D1E] py-2 px-4 rounded-2xl mt-2 text-md text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-6">
          <EntityReviews
            reviews={reviews}
            loading={reviewsLoading}
            error={reviewsError}
            entityType="circuit"
            entityId={id}
          />
          <div className="d-flex justify-content-center mb-3 mt-4">
            <Button
              variant="primary"
              onClick={() => setShowReviewModal(true)}
              className="submit-btn"
            >
              Ajouter un commentaire
            </Button>
          </div>

          <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter un commentaire</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleReviewSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Note (1-5)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Commentaire</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Image (Base64)</Form.Label>
                  <Form.Control
                    type="text"
                    value={image || ''}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!userInfo}
                  className="rounded-lg py-2 px-4 text-white bg-[#2C5BA1] font-semibold hover:bg-[#1e88e5] transition-colors"
                >
                  Soumettre l'avis
                </Button>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
                Annuler
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default CircuitDetail;