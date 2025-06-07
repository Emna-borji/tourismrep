import React, { useState } from 'react';
import { Card, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { deleteReview, updateReview } from '../redux/actions/reviewActions';
import './entityReviews.css';

const EntityReviews = ({ reviews, loading, error, entityType, entityId }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth || {});
  const { updateLoading, updateError, deleteLoading, deleteError } = useSelector(state => state.review || {});
  const isAdmin = userInfo?.role === 'admin';

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: '', image: '' });
  const [visibleReviews, setVisibleReviews] = useState(15);
  const reviewsPerPage = 15;

  console.log('userInfo:', userInfo);
  reviews.forEach(review => {
    console.log(`Review ${review.id} user:`, review.user);
    console.log(`Comparing userInfo.id (${userInfo?.id}) with review.user.id (${review.user.id})`);
    console.log(`Is owner: ${String(userInfo?.id) === String(review.user.id)}`);
  });

  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment || '',
      image: review.image || '',
    });
  };

  const handleEditSubmit = (reviewId) => {
    if (editForm.rating < 1 || editForm.rating > 5) {
      alert('La note doit être entre 1 et 5.');
      return;
    }
    const updatedForm = {
      ...editForm,
      image: editForm.image === '' ? null : editForm.image,
    };
    dispatch(updateReview(reviewId, entityType, entityId, updatedForm))
      .then(() => {
        setEditingReviewId(null);
      })
      .catch((error) => {
        console.error('Échec de la mise à jour du commentaire :', error);
      });
  };

  const handleDelete = (reviewId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      dispatch(deleteReview(reviewId, entityType, entityId))
        .catch((error) => {
          console.error('Échec de la suppression du commentaire :', error);
        });
    }
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

  const handleShowMore = () => {
    setVisibleReviews(prev => prev + reviewsPerPage);
  };

  const handleShowLess = () => {
    setVisibleReviews(reviewsPerPage);
  };

  return (
    <div className="entity-reviews-container">
      <div className="title-container">
        <h3 className="main-title">Commentaires clients</h3>
      </div>
      {loading ? (
        <Spinner animation="border" role="status" />
      ) : error ? (
        <Alert variant="danger">Erreur : {error}</Alert>
      ) : reviews.length === 0 ? (
        <div className="flex justify-center items-center w-full mb-4">
          <i className="text-6xl text-gray-400 fas fa-comment-slash"></i>
        </div>
      ) : (
        <>
          {reviews.slice(0, visibleReviews).map((review) => (
            <Card key={review.id} className="mb-3 review-card">
              <Card.Body>
                {editingReviewId === review.id ? (
                  <div>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="5"
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Commentaire</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editForm.comment}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Image (Base64)</Form.Label>
                        <Form.Control
                          type="text"
                          value={editForm.image}
                          onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                        />
                      </Form.Group>
                      <Button
                        variant="success"
                        onClick={() => handleEditSubmit(review.id)}
                        disabled={updateLoading}
                      >
                        Enregistrer
                      </Button>
                      
                      {updateError && <Alert variant="danger" className="mt-2">{updateError}</Alert>}
                    </Form>
                  </div>
                ) : (
                  <>
                    <div className="stars">
                      {renderStars(review.rating)}
                    </div>
                    <div className="infos">
                      <p className="date-time">
                        Posté le {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="description">{review.comment}</p>
                    </div>
                    <div className="author">
                      — {review.user.firstname}
                    </div>
                    {review.image && (
                      <img
                        src={review.image}
                        alt="Commentaire"
                        className="img-fluid rounded mb-2"
                        style={{ maxWidth: '200px' }}
                      />
                    )}
                    {userInfo && String(userInfo.id) === String(review.user.id) && (
                      <Button
                        variant="warning"
                        className="me-2 mt-2"
                        onClick={() => handleEditClick(review)}
                      >
                        Modifier
                      </Button>
                    )}
                    {(userInfo && (String(userInfo.id) === String(review.user.id) || isAdmin)) && (
                      <Button
                        variant="danger"
                        className="mt-2"
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteLoading}
                      >
                        Supprimer
                      </Button>
                    )}
                    {deleteError && <Alert variant="danger" className="mt-2">{deleteError}</Alert>}
                  </>
                )}
              </Card.Body>
            </Card>
          ))}
          {reviews.length > reviewsPerPage && (
            <div className="pagination-buttons">
              {visibleReviews < reviews.length && (
                <Button variant="primary" onClick={handleShowMore} className="me-2">
                  Afficher plus
                </Button>
              )}
              {visibleReviews > reviewsPerPage && (
                <Button variant="secondary" onClick={handleShowLess}>
                  Afficher moins
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EntityReviews;