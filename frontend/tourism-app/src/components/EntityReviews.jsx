import React, { useState } from 'react';
import { Card, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { deleteReview, updateReview } from '../redux/actions/reviewActions';

const EntityReviews = ({ reviews, loading, error, entityType, entityId }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth || {});
  const { updateLoading, updateError, deleteLoading, deleteError } = useSelector(state => state.review || {});
  const isAdmin = userInfo?.role === 'admin';

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: '', image: '' });

  // Debugging: Log userInfo and review user IDs
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
      alert('Rating must be between 1 and 5.');
      return;
    }
    // Ensure image is null if empty to avoid validation error
    const updatedForm = {
      ...editForm,
      image: editForm.image === '' ? null : editForm.image,
    };
    dispatch(updateReview(reviewId, entityType, entityId, updatedForm))
      .then(() => {
        setEditingReviewId(null);
      })
      .catch((error) => {
        console.error('Update review failed:', error);
      });
  };

  const handleDelete = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      dispatch(deleteReview(reviewId, entityType, entityId))
        .catch((error) => {
          console.error('Delete review failed:', error);
        });
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Reviews</Card.Title>
        {loading ? (
          <Spinner animation="border" role="status" />
        ) : error ? (
          <Alert variant="danger">Error: {error}</Alert>
        ) : reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="mb-3 review-card">
              <Card.Body>
                {editingReviewId === review.id ? (
                  <div>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="5"
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Comment</Form.Label>
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
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingReviewId(null)}
                        className="ms-2"
                      >
                        Cancel
                      </Button>
                      {updateError && <Alert variant="danger" className="mt-2">{updateError}</Alert>}
                    </Form>
                  </div>
                ) : (
                  <>
                    <Card.Title>
                      {Array(review.rating).fill().map((_, i) => (
                        <FaStar key={i} color="gold" />
                      ))}
                      <span className="ms-2">by {review.user.name}</span>
                    </Card.Title>
                    <Card.Text>{review.comment}</Card.Text>
                    {review.image && (
                      <img
                        src={review.image}
                        alt="Review"
                        className="img-fluid rounded mb-2"
                        style={{ maxWidth: '200px' }}
                      />
                    )}
                    <Card.Text>
                      <small className="text-muted">
                        Posted on {new Date(review.created_at).toLocaleDateString()}
                      </small>
                    </Card.Text>
                    {userInfo && String(userInfo.id) === String(review.user.id) && (
                      <Button
                        variant="warning"
                        className="me-2"
                        onClick={() => handleEditClick(review)}
                      >
                        Modifier
                      </Button>
                    )}
                    {(userInfo && (String(userInfo.id) === String(review.user.id) || isAdmin)) && (
                      <Button
                        variant="danger"
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
          ))
        )}
      </Card.Body>
    </Card>
  );
};

export default EntityReviews;