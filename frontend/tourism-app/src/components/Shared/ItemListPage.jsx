import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart } from 'react-icons/fa';
import { fetchFavorites, addToFavorite, removeFromFavorite } from '../../redux/actions/favoriteActions';
import { trackClick } from '../../redux/actions/searchActions';
import { createEntity, fetchEntities } from '../../redux/actions/entityActions';
import { renderStars, renderForks } from '../../utils/renderIcons';
import './ItemListPage.css';

const ItemListPage = ({ items, loading, error, itemType, itemDetailsRoute, entityType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading: authLoading } = useSelector((state) => state.auth);
  const { favorites } = useSelector((state) => state.favorites);
  const { loading: trackClickLoading, error: trackClickError } = useSelector((state) => state.trackClick);
  const { createEntityLoading, createEntityError } = useSelector((state) => state.entities);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    latitude: '',
    longitude: '',
    address: '',
    destination_id: '',
    forks: '', // For Restaurant
    cuisine_id: '', // For Restaurant
    stars: '', // For Hotel
    category: '', // For GuestHouse
    date: '', // For Festival
    period: '', // For ArchaeologicalSite
    site_type: '', // For ArchaeologicalSite
    hours: '', // For Museum
    website: '', // For Museum, Hotel, GuestHouse
    phone: '', // For Restaurant, Hotel, GuestHouse
    equipments_ids: [], // For Hotel, GuestHouse
  });

  useEffect(() => {
    if (userInfo) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, userInfo]);

  const handleFavoriteToggle = async (itemId) => {
    if (authLoading) {
      return;
    }
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
      console.error(`Error toggling favorite for ${entityType}:`, err);
    }
  };

  const handleDetailsClick = async (itemId) => {
    if (userInfo) {
      await dispatch(trackClick(entityType, itemId));
      if (trackClickError) {
        console.error('Error tracking click:', trackClickError);
        if (trackClickError.includes('401')) {
          navigate('/login');
          return;
        }
      }
    }

    navigate(`/${itemDetailsRoute}/${itemId}`);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const entityData = { ...formData };

    // Clean up the data based on entityType
    if (entityType === 'restaurant') {
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.equipments_ids;
      entityData.forks = parseInt(entityData.forks) || null;
      entityData.cuisine_id = parseInt(entityData.cuisine_id) || null;
    } else if (entityType === 'hotel') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      entityData.stars = parseInt(entityData.stars) || null;
      entityData.equipments_ids = entityData.equipments_ids.map(id => parseInt(id)) || [];
    } else if (entityType === 'guest_house') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      entityData.equipments_ids = entityData.equipments_ids.map(id => parseInt(id)) || [];
    } else if (entityType === 'festival') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    } else if (entityType === 'archaeological_site') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    } else if (entityType === 'museum') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.phone;
      delete entityData.equipments_ids;
    } else if (entityType === 'activity') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    }

    // Convert numeric fields
    entityData.price = parseFloat(entityData.price) || null;
    entityData.latitude = parseFloat(entityData.latitude) || null;
    entityData.longitude = parseFloat(entityData.longitude) || null;
    entityData.destination_id = parseInt(entityData.destination_id) || null;

    dispatch(createEntity(entityType, entityData)).then(() => {
      handleCloseModal();
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        latitude: '',
        longitude: '',
        address: '',
        destination_id: '',
        forks: '',
        cuisine_id: '',
        stars: '',
        category: '',
        date: '',
        period: '',
        site_type: '',
        hours: '',
        website: '',
        phone: '',
        equipments_ids: [],
      });
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger">Error: {error}</p>;
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mt-5">
        <h1>{itemType}</h1>
        {userInfo && userInfo.role==="admin" && (
          <Button
            variant="success"
            onClick={handleShowModal}
            className="add-entity-btn"
          >
            Ajouter {entityType === 'guest_house' ? 'Guest House' : itemType.slice(0, -1)}
          </Button>
        )}
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter {entityType === 'guest_house' ? 'Guest House' : itemType.slice(0, -1)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createEntityError && (
            <p className="text-danger">{createEntityError}</p>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prix</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Destination ID</Form.Label>
              <Form.Control
                type="number"
                name="destination_id"
                value={formData.destination_id}
                onChange={handleInputChange}
              />
            </Form.Group>

            {entityType === 'restaurant' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Forks (1-3)</Form.Label>
                  <Form.Control
                    type="number"
                    name="forks"
                    value={formData.forks}
                    onChange={handleInputChange}
                    min="1"
                    max="3"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cuisine ID</Form.Label>
                  <Form.Control
                    type="number"
                    name="cuisine_id"
                    value={formData.cuisine_id}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            {entityType === 'hotel' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Stars (1-5)</Form.Label>
                  <Form.Control
                    type="number"
                    name="stars"
                    value={formData.stars}
                    onChange={handleInputChange}
                    min="1"
                    max="5"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Site Web</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Equipments IDs (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="equipments_ids"
                    value={formData.equipments_ids.join(',')}
                    onChange={(e) => setFormData({ ...formData, equipments_ids: e.target.value.split(',').map(id => id.trim()) })}
                  />
                </Form.Group>
              </>
            )}

            {entityType === 'guest_house' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="Basique">Basique</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxe">Luxe</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Site Web</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Equipments IDs (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="equipments_ids"
                    value={formData.equipments_ids.join(',')}
                    onChange={(e) => setFormData({ ...formData, equipments_ids: e.target.value.split(',').map(id => id.trim()) })}
                  />
                </Form.Group>
              </>
            )}

            {entityType === 'festival' && (
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}

            {entityType === 'archaeological_site' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Période</Form.Label>
                  <Form.Control
                    type="text"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Type de Site</Form.Label>
                  <Form.Control
                    type="text"
                    name="site_type"
                    value={formData.site_type}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            {entityType === 'museum' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Heures d'ouverture (e.g., 9 AM - 5 PM)</Form.Label>
                  <Form.Control
                    type="text"
                    name="hours"
                    value={formData.hours}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Site Web</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            <Button
              variant="primary"
              type="submit"
              disabled={createEntityLoading}
            >
              {createEntityLoading ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Row className="mt-4">
        {items.map((item) => {
          const isFavorited = favorites.some(
            (fav) => fav.entity_type === entityType && fav.entity_id === item.id
          );

          return (
            <Col md={4} key={item.id} className="mb-4">
              <Card className="custom-card h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={item.image || item.image_url || item.images}
                  alt={item.name}
                  className="custom-card-img"
                />
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <Card.Title className="custom-title">{item.name}</Card.Title>
                    {entityType === 'hotel' && item.stars && (
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">Stars:</span>
                        {renderStars(item.stars, 5)}
                        <span className="ms-2 text-muted">{item.stars}</span>
                      </div>
                    )}
                    {entityType === 'restaurant' && item.forks && (
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">Forks:</span>
                        {renderForks(item.forks, 3)}
                      </div>
                    )}
                    {item.rating !== null && (
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">Rating:</span>
                        {renderStars(Math.round(item.rating), 5)}
                        <span className="ms-2 text-muted">({item.rating}/5)</span>
                      </div>
                    )}
                    {item.address && (
                      <Card.Text className="custom-location">
                        <FaMapMarkerAlt className="me-2 text-primary" />
                        {item.address}
                      </Card.Text>
                    )}
                    {item.destination && (
                      <Card.Text className="custom-region">
                        <FaLocationArrow className="me-2 text-dark" />
                        {item.destination.name}
                      </Card.Text>
                    )}
                    {entityType === 'guest_house' && item.category && (
                      <Card.Text>
                        Catégorie: {item.category}
                      </Card.Text>
                    )}
                    {entityType === 'festival' && item.date && (
                      <Card.Text>
                        Date: {item.date}
                      </Card.Text>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    {item.price && (
                      <span className="custom-price">
                        à partir de <strong>{item.price} DT</strong>
                      </span>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => handleDetailsClick(item.id)}
                      className="custom-details-btn"
                      disabled={trackClickLoading}
                    >
                      {trackClickLoading ? 'Chargement...' : 'Plus de détails'}
                    </Button>
                  </div>
                </Card.Body>
                <div className="favorite-icon" onClick={() => handleFavoriteToggle(item.id)}>
                  {isFavorited ? (
                    <FaHeart color="red" size={24} />
                  ) : (
                    <FaRegHeart color="gray" size={24} />
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default ItemListPage;