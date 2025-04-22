// src/pages/EntityDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteEntity, fetchEntityById, updateEntity } from '../../redux/actions/entityActions';
import { fetchReviews, createReview, clearReviewSuccess } from '../../redux/actions/reviewActions';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Carousel } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart, FaStar, FaExclamationCircle } from 'react-icons/fa';
import { fetchFavorites, addToFavorite, removeFromFavorite } from '../../redux/actions/favoriteActions';
import EntityHeader from '../EntityHeader';
import EntityDescription from '../EntityDescription';
import EntityReviews from '../EntityReviews';
import AddReviewForm from '../AddReviewForm';
import EditEntityModal from '../EditEntityModal';
import DeleteEntityModal from '../DeleteEntityModal';
import './entityDetailPage.css';

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

  useEffect(() => {
    dispatch(fetchEntityById(entityType, id));
    dispatch(fetchReviews(entityType, id));
    if (userInfo) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, entityType, id, userInfo]);

  useEffect(() => {
    if (entity) {
      console.log('Entity destination_id:', entity.destination_id); // Debug log
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
        destination_id: entity.destination_id || '', // Ensure default to empty string
      });
    }
  }, [entity]);

  const isFavorited = favorites.some(
    (fav) => fav.entity_type === entityType && fav.entity_id === parseInt(id)
  );

  const handleFavoriteToggle = async () => {
    if (authLoading) return;
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        await dispatch(removeFromFavorite(entityType, id));
      } else {
        await dispatch(addToFavorite(entityType, id));
      }
    } catch (err) {
      console.error(`Error toggling favorite for ${entityType}:`, err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(createReview(entityType, id, { rating, comment, image }));
      setRating(0);
      setComment('');
      setImage(null);
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form data:", formData); // Debug log

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
    console.log("Cleaned form data:", cleanedFormData);
    dispatch(updateEntity(entityType, id, cleanedFormData)).then(() => {
      setShowEditModal(false);
    }).catch((error) => {
      console.error("Update failed:", error.response?.data);
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="text-center mt-5">Error: {error}</Alert>;
  }

  if (!entity) {
    return <Alert variant="warning" className="text-center mt-5">Entity not found.</Alert>;
  }

  return (
    <Container className="mt-5 entity-detail-container">
      <EntityHeader
        entity={entity}
        entityType={entityType}
        isFavorited={isFavorited}
        handleFavoriteToggle={handleFavoriteToggle}
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
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          {createSuccess && (
            <Alert variant="success" dismissible onClose={() => dispatch(clearReviewSuccess())}>
              Review submitted successfully!
            </Alert>
          )}
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
  );
};

export default EntityDetailPage;