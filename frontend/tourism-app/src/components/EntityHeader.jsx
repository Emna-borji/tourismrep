// src/components/EntityHeader.jsx
import React, { useEffect } from 'react';
import { Card, Col, Row, Carousel, Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart, FaEdit, FaTrash, FaMap } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { trackClick } from '../redux/actions/searchActions';
import { renderStars, renderForks } from '../utils/renderIcons';
import EntityLocationMap from './EntityLocationMap'; // Import the new component
import './entityHeader.css';

const EntityHeader = ({
  entity,
  entityType,
  isFavorited,
  handleFavoriteToggle,
  userInfo,
  setShowEditModal,
  setShowDeleteModal,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading: trackClickLoading, error: trackClickError } = useSelector((state) => state.trackClick);

  useEffect(() => {
    if (!entityType) {
      console.error('entityType is undefined in EntityHeader component');
      return;
    }

    // Track the click when the details page loads
    if (userInfo) {
      dispatch(trackClick(entityType, entity.id));
      if (trackClickError) {
        console.error('Error tracking click:', trackClickError);
        if (trackClickError.includes('401')) {
          navigate('/login');
        }
      }
    }
  }, [dispatch, entity.id, entityType, userInfo, trackClickError, navigate]);

  console.log('Entity:', entity);
  console.log('Entity Type:', entityType);
  console.log('Equipments:', entity.equipments);

  const hasAddress = entity.address && entity.address.trim() !== '';

  const handleItineraryClick = () => {
    if (entity.latitude && entity.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${entity.latitude},${entity.longitude}`;
      window.open(url, '_blank');
    } else {
      alert("Les coordonnées de cet emplacement ne sont pas disponibles.");
    }
  };

  return (
    <div className="entity-details-container">
      <div className="entity-main-image-container position-relative">
        {entityType === 'restaurant' && entity.additional_images && entity.additional_images.length > 0 ? (
          <Carousel className="entity-carousel">
            {entity.additional_images.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  src={img.image_url}
                  alt={`${entity.name} ${index}`}
                  className="d-block w-100 carousel-img"
                  style={{ height: '400px', objectFit: 'cover' }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <img
            src={entity.image || entity.image_url || entity.images}
            alt={entity.name}
            className="img-fluid w-100"
            style={{ height: '400px', objectFit: 'cover' }}
          />
        )}
        <div className="entity-overlay position-absolute top-50 start-50 translate-middle text-center text-white">
          <h1 className="entity-title">{entity.name}</h1>
        </div>
      </div>

      <Row className="mt-4">
        <Col md={8}>
          {entityType === 'restaurant' && entity.additional_images && entity.additional_images.length > 0 && (
            <div className="additional-images mb-4 d-flex overflow-auto">
              {entity.additional_images.map((img, index) => (
                <img
                  key={index}
                  src={img.image_url}
                  alt={`${entity.name} ${index}`}
                  className="img-thumbnail me-2"
                  style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
          {/* Add the EntityLocationMap component */}
          <EntityLocationMap entity={entity} />
        </Col>
        <Col md={4}>
          <Card className="entity-info-card shadow-sm border-0">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center">
                <span>{entity.name}</span>
                <div onClick={handleFavoriteToggle} style={{ cursor: 'pointer' }}>
                  {isFavorited ? <FaHeart color="red" size={24} /> : <FaRegHeart color="gray" size={24} />}
                </div>
              </Card.Title>

              {entityType === 'hotel' && entity.stars && (
                <Card.Text className="d-flex align-items-center">
                  <span className="me-2">Stars:</span>
                  {renderStars(entity.stars, 5)}
                </Card.Text>
              )}
              {entityType === 'restaurant' && entity.forks && (
                <Card.Text className="d-flex align-items-center">
                  <span className="me-2">Forks:</span>
                  {renderForks(entity.forks, 3)}
                </Card.Text>
              )}
              {entity.rating !== null && (
                <Card.Text className="d-flex align-items-center">
                  <span className="me-2">Rating:</span>
                  {renderStars(Math.round(entity.rating), 5)}
                  <span className="ms-2">({entity.rating}/5)</span>
                </Card.Text>
              )}

              {hasAddress && (
                <Card.Text>
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  {entity.address}
                </Card.Text>
              )}

              {entity.destination && (
                <Card.Text>
                  <FaLocationArrow className="me-2 text-dark" />
                  {entity.destination}
                </Card.Text>
              )}

              {(entity.latitude || entity.longitude) && (
                <Button
                  variant="primary"
                  onClick={handleItineraryClick}
                  className="mb-3"
                >
                  <FaMap className="me-1" /> Itinéraire
                </Button>
              )}

              {entityType === 'restaurant' && entity.cuisine && (
                <Card.Text>
                  Cuisine: {entity.cuisine}
                </Card.Text>
              )}

              {entity.price && (
                <Card.Text>
                  Prix: <strong>{entity.price} DT</strong>
                </Card.Text>
              )}

              {entityType === 'guest_house' && entity.category && (
                <Card.Text>Catégorie: {entity.category}</Card.Text>
              )}
              {entityType === 'festival' && entity.date && (
                <Card.Text>Date: {entity.date}</Card.Text>
              )}
              {entityType === 'museum' && entity.hours && (
                <Card.Text>Heures: {entity.hours}</Card.Text>
              )}
              {entityType === 'archaeological_site' && entity.period && (
                <Card.Text>Période: {entity.period}</Card.Text>
              )}
              {entityType === 'archaeological_site' && entity.site_type && (
                <Card.Text>Type de site: {entity.site_type}</Card.Text>
              )}
              {entity.phone && (
                <Card.Text>Téléphone: {entity.phone}</Card.Text>
              )}
              {(entity.website || entity.site_web) && (
                <Card.Text>
                  Site web:{' '}
                  <a href={entity.website || entity.site_web} target="_blank" rel="noopener noreferrer">
                    {entity.website || entity.site_web}
                  </a>
                </Card.Text>
              )}

              {(entityType.toLowerCase() === 'hotel' || entityType.toLowerCase() === 'guest_house') && entity.equipments && entity.equipments.length > 0 ? (
                <div className="equipments-section mt-3">
                  <h5>Équipements</h5>
                  <ul className="equipments-list list-unstyled">
                    {entity.equipments.map((eq, index) => (
                      <li key={index} className="d-flex align-items-center">
                        <span className="me-2">•</span>
                        {eq.name || 'Nom non disponible'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                (entityType.toLowerCase() === 'hotel' || entityType.toLowerCase() === 'guest_house') && (
                  <div className="equipments-section mt-3">
                    <h5>Équipements</h5>
                    <p>Aucun équipement disponible.</p>
                  </div>
                )
              )}

              {userInfo && userInfo.role === 'admin' && (
                <div className="admin-actions mt-3">
                  <Button
                    variant="warning"
                    onClick={() => setShowEditModal(true)}
                    className="me-2 admin-btn"
                  >
                    <FaEdit className="me-1" /> Modifier
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                    className="admin-btn"
                  >
                    <FaTrash className="me-1" /> Supprimer
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EntityHeader;