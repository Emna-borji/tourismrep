import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar, FaUtensilSpoon } from 'react-icons/fa';
import { fetchFavorites, addToFavorite, removeFromFavorite } from '../../redux/actions/favoriteActions';
import { deleteEntity, fetchEntityById, updateEntity, fetchEntities } from '../../redux/actions/entityActions';
import { fetchReviews, createReview, clearReviewSuccess } from '../../redux/actions/reviewActions';
import EntityHeader from '../EntityHeader';
import EntityDescription from '../EntityDescription';
import EntityReviews from '../EntityReviews';
import AddReviewForm from '../AddReviewForm';
import EditEntityModal from '../EditEntityModal';
import DeleteEntityModal from '../DeleteEntityModal';
import './entityDetailPage.css';
import HeroSection from '../Shared/HeroSection';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { calculateDistance } from '../../utils/geoUtils';
import Slider from 'react-slick';

const entityHeroConfig = {
  hotel: {
    image: 'https://digital.ihg.com/is/image/ihg/intercontinental-tegucigalpa-6071105521-2x1',
    title: 'Explorez les Hôtels de Tunisie',
    subtitle: 'Découvrez des séjours luxueux et confortables',
  },
  restaurant: {
    image: 'https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e83ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png',
    title: 'Savourez la Cuisine Tunisienne',
    subtitle: 'Découvrez les meilleurs restaurants locaux',
  },
  guest_house: {
    image: 'https://www.phgmag.com/wp-content/uploads/2020/07/PHG0820Art01Roberts01.jpg',
    title: 'Explorez les Maisons d’Hôtes de Tunisie',
    subtitle: 'Vivez une expérience authentique et chaleureuse',
  },
  festival: {
    image: 'https://media.istockphoto.com/id/1806011581/fr/photo/des-jeunes-gens-heureux-et-ravis-de-danser-de-sauter-et-de-chanter-pendant-le-concert-de-leur.jpg?s=612x612&w=0&k=20&c=d1GQ5j33_Ie7DBUM0gTxQcaPhkEIQxkBlWO0TLNPB8M=',
    title: 'Vivez les Festivals de Tunisie',
    subtitle: 'Plongez dans la culture et la fête',
  },
  activity: {
    image: 'https://www.pebbls.com/wp-content/uploads/2024/02/adventure-travel-header.jpg',
    title: 'Aventures en Tunisie',
    subtitle: 'Découvrez des activités passionnantes',
  },
  archaeological_site: {
    image: 'https://i0.wp.com/theluxurytravelexpert.com/wp-content/uploads/2020/05/top-10-ruins-archaelogical-sites-word-travel.jpg?fit=1600%2C900&ssl=1',
    title: 'Explorez les Sites Archéologiques de Tunisie',
    subtitle: 'Découvrez l’histoire ancienne du pays',
  },
  museum: {
    image: 'https://lp-cms-production.imgix.net/2019-06/b492455d0819654b7df1f38ee6947163-bardo-museum.jpg',
    title: 'Découvrez les Musées de Tunisie',
    subtitle: 'Explorez l’histoire et la culture tunisienne',
  },
};

const mainEntityIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

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

const EntityDetailPage = () => {
  const { entityType, id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { entity, loading, error, updateLoading, updateError, deleteLoading, deleteError } = useSelector((state) => state.entities);
  const { reviews, loading: reviewsLoading, error: reviewsError, createLoading, createError, createSuccess } = useSelector((state) => state.reviews);
  const { userInfo, loading: authLoading } = useSelector((state) => state.auth);
  const { favorites } = useSelector((state) => state.favorites);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [nearbyEntities, setNearbyEntities] = useState([]);
  const mapRef = useRef();
  const MAX_DISTANCE = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    console.log('Initial useEffect triggered at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), { entityType, id, userInfo });
    if (!entityType || !id) {
      console.error('Invalid entityType or id:', { entityType, id });
      return;
    }
    if (isInitialLoad) {
      dispatch(fetchEntityById(entityType, id));
      dispatch(fetchReviews(entityType, parseInt(id)));
      if (userInfo) {
        dispatch(fetchFavorites());
      }
      setIsInitialLoad(false);
    }
  }, [dispatch, entityType, id, userInfo, isInitialLoad]);

  useEffect(() => {
    console.log('Entity data:', entity);
    if (entity && entity.latitude && entity.longitude) {
      dispatch(fetchEntities(entityType, { searchQuery: '' })).then((data) => {
        console.log('Fetched entities for nearby calculation:', data);
        const nearby = data
          .filter((e) => e.id !== parseInt(id) && e.latitude && e.longitude)
          .map((e) => ({
            ...e,
            distance: calculateDistance(
              entity.latitude,
              entity.longitude,
              e.latitude,
              e.longitude
            ),
          }))
          .filter((e) => e.distance <= MAX_DISTANCE)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);
        console.log('Nearby entities calculated:', nearby);
        setNearbyEntities(nearby);
        if (mapRef.current && nearby.length > 0) {
          mapRef.current.flyTo([entity.latitude, entity.longitude], 13);
        }
      }).catch((error) => {
        console.error('Error fetching nearby entities:', error);
      });
    }
  }, [entity, entityType, id, dispatch]);

  useEffect(() => {
    if (entity) {
      console.log('Updating form data at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), 'with entity:', entity.destination_id);
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        price: entity.price || '',
        image: entity.image || entity.image_url || entity.images || '',
        phone: entity.phone || '',
        website: entity.website || entity.site_web || '',
        address: entity.address || '',
        location: entity.location || '',
        latitude: entity.latitude || '',
        longitude: entity.longitude || '',
        forks: entity.forks || '',
        stars: entity.stars || '',
        category: entity.category || '',
        date: entity.date || '',
        hours: entity.hours || '',
        period: entity.period || '',
        site_type: entity.site_type || '',
        destination_id: entity.destination_id || '',
      });
    }
  }, [entity]);

  const isFavorited = favorites.some(
    (fav) => fav.entity_type === entityType && fav.entity_id === parseInt(id)
  );

  const handleFavoriteToggle = async (itemId) => {
    if (authLoading) return;
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const isFavorited = favorites.some(
      (fav) => fav.entity_type === entityType && fav.entity_id === itemId
    );

    try {
      if (isFavorited) {
        await dispatch(removeFromFavorite(entityType, itemId));
      } else {
        await dispatch(addToFavorite(entityType, itemId));
      }
    } catch (err) {
      console.error(`Error toggling favorite for ${entityType} at ${new Date().toLocaleString('fr-FR', { timeZone: 'CET' })}:`, err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(createReview(entityType, parseInt(id), { rating, comment, image }));
      setRating(0);
      setComment('');
      setImage(null);
      setShowForm(false);
    } catch (error) {
      console.error('Review submission failed at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), ':', error);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting form data at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), ':', formData);

    const cleanedFormData = {
      name: formData.name,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : null,
      image: formData.image,
      phone: formData.phone,
      site_web: formData.website,
      address: formData.address,
      forks: formData.forks ? parseInt(formData.forks, 10) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      destination_id: formData.destination_id ? parseInt(formData.destination_id, 10) : null,
      stars: formData.stars ? parseInt(formData.stars, 10) : null,
      category: formData.category || null,
      date: formData.date || null,
      hours: formData.hours || null,
      location: formData.location || null,
      period: formData.period || null,
      site_type: formData.site_type || null,
    };
    console.log('Cleaned form data at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), ':', cleanedFormData);
    dispatch(updateEntity(entityType, id, cleanedFormData)).then(() => {
      setShowEditModal(false);
    }).catch((error) => {
      console.error('Update failed at', new Date().toLocaleString('fr-FR', { timeZone: 'CET' }), ':', error.response?.data);
    });
  };

  const handleDelete = () => {
    dispatch(deleteEntity(entityType, id)).then(() => {
      navigate(`/${entityType}s`);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className="star" />);
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(<FaStarHalfAlt key={i} className="star" />);
      } else {
        stars.push(<FaRegStar key={i} className="star" />);
      }
    }
    return stars;
  };

  const renderForks = (forks, max = 3) => {
    const forkIcons = [];
    for (let i = 1; i <= max; i++) {
      if (i <= forks) {
        forkIcons.push(<FaUtensilSpoon key={i} className="star" />);
      } else {
        forkIcons.push(<FaUtensilSpoon key={i} className="star" style={{ opacity: 0.3 }} />);
      }
    }
    return forkIcons;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Chargement en cours...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="text-center mt-5">Erreur : {error}</Alert>;
  }

  if (!entity) {
    return <Alert variant="warning" className="text-center mt-5">Entité non trouvée.</Alert>;
  }

  const heroConfig = entityHeroConfig[entityType] || {
    image: 'https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e38ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png',
    title: 'Explorez la Tunisie',
    subtitle: 'Découvrez les meilleures destinations touristiques',
  };

  return (
    <>
      <HeroSection
        image={entity.image || heroConfig.image}
        title={heroConfig.title}
        subtitle={heroConfig.subtitle}
      />
      <Container className="mt-5 entity-detail-container">
        <EntityHeader
          entity={entity}
          entityType={entityType}
          isFavorited={isFavorited}
          handleFavoriteToggle={() => handleFavoriteToggle(parseInt(id))}
          userInfo={userInfo}
          setShowEditModal={setShowEditModal}
          setShowDeleteModal={setShowDeleteModal}
        />

        <EntityDescription description={entity.description} />

        <Row className="mb-4">
          <Col>
            <EntityReviews
              reviews={reviews}
              loading={reviewsLoading}
              error={reviewsError}
              entityType={entityType}
              entityId={parseInt(id)}
            />
          </Col>
        </Row>
        <div className="d-flex justify-content-center mb-3">
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="submit-btn"
          >
            Ajouter un commentaire
          </Button>
        </div>

        {/* Nearby Entities Carousel */}
        {entity.latitude && entity.longitude && nearbyEntities.length > 0 && (
          <Row className="mb-4">
            <Col>
              <h3 className="tourism-section-title">Entités à proximité</h3>
              <Slider
                dots={false}
                infinite={false}
                speed={500}
                slidesToShow={4}
                slidesToScroll={1}
                arrows={true}
                className="proximity-carousel"
                responsive={[
                  {
                    breakpoint: 768,
                    settings: {
                      slidesToShow: 2,
                      slidesToScroll: 1,
                    },
                  },
                  {
                    breakpoint: 576,
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                    },
                  },
                ]}
              >
                {nearbyEntities.map((nearbyEntity) => {
                  const isNearbyFavorited = favorites.some(
                    (fav) => fav.entity_type === (nearbyEntity.entity_type || entityType) && fav.entity_id === nearbyEntity.id
                  );
                  return (
                    <div key={nearbyEntity.id} className="carousel-card">
                      <Card className="custom-card h-100 shadow-sm position-relative">
                        <Card.Img
                          variant="top"
                          src={nearbyEntity.image || 'https://via.placeholder.com/300x200'}
                          alt={nearbyEntity.name}
                          className="custom-card-img"
                        />
                        {(nearbyEntity.forks || nearbyEntity.stars) && (
                          <div className="rating-badge-image">
                            {(nearbyEntity.entity_type || entityType) === 'restaurant' && nearbyEntity.forks && renderForks(nearbyEntity.forks, 3)}
                            {(nearbyEntity.entity_type || entityType) === 'hotel' && nearbyEntity.stars && renderStars(nearbyEntity.stars, 5)}
                          </div>
                        )}
                        <Card.Body className="d-flex flex-column justify-content-between">
                          <div>
                            <Card.Title className="custom-title">{nearbyEntity.name || 'Nom indisponible'}</Card.Title>
                            <Card.Text className="custom-location">
                              <FaMapMarkerAlt className="me-2" size={30} />
                              <span className="address-text">{nearbyEntity.distance.toFixed(2)} km</span>
                            </Card.Text>
                            {nearbyEntity.destination && (
                              <Card.Text className="custom-region">
                                <FaLocationArrow className="me-2 text-dark" size={16} />
                                {nearbyEntity.destination}
                              </Card.Text>
                            )}
                            {(nearbyEntity.entity_type || entityType) === 'guest_house' && nearbyEntity.category && (
                              <Card.Text>
                                Catégorie : {nearbyEntity.category}
                              </Card.Text>
                            )}
                            {(nearbyEntity.entity_type || entityType) === 'festival' && nearbyEntity.date && (
                              <Card.Text>
                                Date : {nearbyEntity.date}
                              </Card.Text>
                            )}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            {nearbyEntity.price && (
                              <div className="price-stack">
                                <div className="price-prefix">à partir de</div>
                                <div className="price-value"><strong>{nearbyEntity.price} DT</strong></div>
                              </div>
                            )}
                            <Button
                              style={{ backgroundColor: '#34495e', borderColor: '#34495e', color: 'white' }}
                              onClick={() => navigate(`/${nearbyEntity.entity_type || entityType}/${nearbyEntity.id}`)}
                              className="custom-details-btn"
                            >
                              Plus de détails
                            </Button>
                          </div>
                        </Card.Body>
                        <div className="favorite-icon" onClick={() => handleFavoriteToggle(nearbyEntity.id)}>
                          {isNearbyFavorited ? (
                            <FaHeart color="red" size={24} />
                          ) : (
                            <FaRegHeart color="gray" size={24} />
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </Slider>
            </Col>
          </Row>
        )}

        {/* Map Display */}
        {entity.latitude && entity.longitude ? (
          <Row className="mb-4">
            <Col>
              <h3 className="tourism-section-title">Carte des environs</h3>
              {nearbyEntities.length === 0 ? (
                <Alert variant="info">Aucune entité à proximité dans un rayon de {MAX_DISTANCE} km.</Alert>
              ) : (
                <MapContainer
                  ref={mapRef}
                  center={[entity.latitude, entity.longitude]}
                  zoom={13}
                  className="tourism-map-display"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[entity.latitude, entity.longitude]}
                    icon={mainEntityIcon}
                  >
                    <Popup>{entity.name} (Vous êtes ici)</Popup>
                  </Marker>
                  {nearbyEntities.map((nearbyEntity) => (
                    <Marker
                      key={nearbyEntity.id}
                      position={[nearbyEntity.latitude, nearbyEntity.longitude]}
                      icon={entityIcons[nearbyEntity.entity_type || entityType] || mainEntityIcon}
                    >
                      <Popup>
                        {nearbyEntity.name} <br /> Distance : {nearbyEntity.distance.toFixed(2)} km
                        <br />
                        <Button
                          variant="link"
                          onClick={() => navigate(`/${nearbyEntity.entity_type || entityType}/${nearbyEntity.id}`)}
                          style={{ padding: 0, color: '#007bff' }}
                        >
                          Voir les détails
                        </Button>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </Col>
          </Row>
        ) : (
          <Row className="mb-4">
            <Col>
              <Alert variant="warning">Les coordonnées de cette entité ne sont pas disponibles pour afficher la carte.</Alert>
            </Col>
          </Row>
        )}

        <Row className="mb-4">
          <Col className="d-flex justify-content-center">
            {createSuccess && (
              <Alert variant="success" dismissible onClose={() => dispatch(clearReviewSuccess())}>
                Avis soumis avec succès !
              </Alert>
            )}

            <Modal show={showForm} onHide={() => setShowForm(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Ajouter un commentaire</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <AddReviewForm
                  rating={rating}
                  setRating={setRating}
                  comment={comment}
                  setComment={setComment}
                  image={image}
                  setImage={setImage}
                  handleReviewSubmit={handleReviewSubmit}
                  createLoading={createLoading}
                  createError={createError}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>

        <EditEntityModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          entityType={entityType}
          formData={formData}
          handleInputChange={handleInputChange}
          handleEditSubmit={handleEditSubmit}
          updateLoading={updateLoading}
          updateError={updateError}
        />

        <DeleteEntityModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          entityType={entityType}
          handleDelete={handleDelete}
          deleteLoading={deleteLoading}
          deleteError={deleteError}
        />
      </Container>
    </>
  );
};

export default EntityDetailPage;