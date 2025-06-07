import React, { useEffect } from 'react';
import { Col, Row, Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart, FaEdit, FaTrash, FaMap, FaPizzaSlice, FaUtensils, FaMoneyBillWave, FaGlobe } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { trackClick } from '../redux/actions/searchActions';
import { renderStars, renderForks } from '../utils/renderIcons';
import EntityLocationMap from './EntityLocationMap';
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

  // Custom render for forks in EntityHeader (single fork symbol)
  const customRenderForks = (forks) => {
    return (
      <>
        <span className="me-2">{forks}</span>
        <FaUtensils style={{ color: '#6c757d' }} size={16} />
      </>
    );
  };

  // Custom render for rating in EntityHeader (single star symbol)
  const customRenderRating = (rating) => {
    return (
      <>
        <span className="me-2">{rating}</span>
        <span style={{ color: '#ffc107' }}>★</span>
      </>
    );
  };

  return (
    <div className="entity-header-container">
      <div className="entity-header-top">
        <div className="entity-header-left">
          <h1 className="entity-name">{entity.name}</h1>
        </div>
        <div className="entity-favorite-icon" onClick={handleFavoriteToggle}>
          {isFavorited ? <FaHeart color="red" size={24} /> : <FaRegHeart color="gray" size={24} />}
        </div>
      </div>
      <Row className="align-items-center">
        <Col md={6}>
          <div className="entity-details-left">
            {entityType === 'restaurant' && entity.cuisine && (
              <div className="entity-cuisine">
                <FaPizzaSlice className="me-2 text-primary" size={30} />
                <span>Cuisine: {entity.cuisine}</span>
              </div>
            )}
            {hasAddress && (
              <div className="entity-address">
                <FaMapMarkerAlt className="me-2 text-primary" size={30} />
                <span className="address-text">{entity.address}</span>
              </div>
            )}
          </div>
        </Col>
        <Col md={6}>
          <div className="entity-header-right">
            {entityType === 'hotel' && entity.stars && (
              <div className="entity-stars d-flex align-items-center">
                <span className="me-2">Stars:</span>
                {renderStars(entity.stars, 5)}
              </div>
            )}
            {entityType === 'restaurant' && entity.forks && (
              <div className="entity-forks d-flex align-items-center">
                {customRenderForks(entity.forks)}
              </div>
            )}
            {entity.rating !== null && (
              <div className="entity-rating d-flex align-items-center mt-2">
                {customRenderRating(entity.rating)}
              </div>
            )}
          </div>
        </Col>
      </Row>
      <div className="entity-details-above-map mt-3">
        {entity.price && (
          <div className="entity-detail-item">
            <FaMoneyBillWave className="me-2 text-primary" size={16} />
            <span>Prix : <strong>{entity.price} DT</strong></span>
          </div>
        )}
        {(entity.website || entity.site_web) && (
          <div className="entity-detail-item">
            <FaGlobe className="me-2 text-primary" size={16} />
            <span>
              Site web :{' '}
              <a href={entity.website || entity.site_web} target="_blank" rel="noopener noreferrer" className="website-link">
                Visiter le site
              </a>
            </span>
          </div>
        )}
        <div className="entity-detail-item destination-row">
          {entity.destination && (
            <div className="destination-text">
              <FaLocationArrow className="me-2 text-dark" size={16} />
              <span>{entity.destination}</span>
            </div>
          )}
          {(entity.latitude || entity.longitude) && (
            <Button
              variant="primary"
              onClick={handleItineraryClick}
              className="itinerary-btn"
            >
              <FaMap className="me-1" /> Itinéraire
            </Button>
          )}
        </div>
      </div>
      <EntityLocationMap entity={entity} />
      {entityType === 'restaurant' && entity.additional_images && entity.additional_images.length > 0 && (
        <div className="additional-images mt-4 d-flex overflow-auto">
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
      <div className="entity-details-below mt-4">
        {entityType === 'guest_house' && entity.category && (
          <div className="entity-detail-item">
            <span>Catégorie: {entity.category}</span>
          </div>
        )}
        {entityType === 'festival' && entity.date && (
          <div className="entity-detail-item">
            <span>Date: {entity.date}</span>
          </div>
        )}
        {entityType === 'museum' && entity.hours && (
          <div className="entity-detail-item">
            <span>Heures: {entity.hours}</span>
          </div>
        )}
        {entityType === 'archaeological_site' && entity.period && (
          <div className="entity-detail-item">
            <span>Période: {entity.period}</span>
          </div>
        )}
        {entityType === 'archaeological_site' && entity.site_type && (
          <div className="entity-detail-item">
            <span>Type de site: {entity.site_type}</span>
          </div>
        )}
        {entity.phone && (
          <div className="entity-detail-item">
            <span>Téléphone: {entity.phone}</span>
          </div>
        )}
        {(entityType.toLowerCase() === 'hotel' || entityType.toLowerCase() === 'guest_house') && (
          <div className="equipments-section mt-3">
            <h5>Équipements</h5>
            {entity.equipments && entity.equipments.length > 0 ? (
              <ul className="equipments-list list-unstyled">
                {entity.equipments.map((eq, index) => (
                  <li key={index} className="d-flex align-items-center">
                    <span className="me-2">•</span>
                    {eq.name || 'Nom non disponible'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun équipement disponible.</p>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default EntityHeader;