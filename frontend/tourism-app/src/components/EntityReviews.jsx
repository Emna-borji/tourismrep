// src/components/EntityReviews.jsx
import React from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';

const EntityReviews = ({ reviews, loading, error }) => {
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
                <Card.Title>
                  {Array(review.rating).fill().map((_, i) => (
                    <FaStar key={i} color="gold" />
                  ))}
                  <span className="ms-2">by {review.user.username}</span>
                </Card.Title>
                <Card.Text>{review.comment}</Card.Text>
                {review.image && (
                  <img src={review.image} alt="Review" className="img-fluid rounded mb-2" style={{ maxWidth: '200px' }} />
                )}
                <Card.Text>
                  <small className="text-muted">
                    Posted on {new Date(review.created_at).toLocaleDateString()}
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>
          ))
        )}
      </Card.Body>
    </Card>
  );
};

export default EntityReviews;