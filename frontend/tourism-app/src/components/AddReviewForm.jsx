// src/components/AddReviewForm.jsx
import React from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';

const AddReviewForm = ({
  rating,
  setRating,
  comment,
  setComment,
  image,
  setImage,
  handleReviewSubmit,
  createLoading,
  createError,
}) => {
  const isFormValid = rating >= 1 && rating <= 5 && comment.trim() !== '';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Add a Review</Card.Title>
        {createError && <Alert variant="danger">{createError}</Alert>}
        <Form onSubmit={handleReviewSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Rating (Required)</Form.Label>
            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={30}
                  color={star <= rating ? 'gold' : 'gray'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            {rating === 0 && (
              <Form.Text className="text-danger">
                Please select a rating.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload Image (Optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && (
              <div className="mt-2">
                <img src={image} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
              </div>
            )}
          </Form.Group>
          <Button
            type="submit"
            disabled={createLoading || !isFormValid}
            className="submit-btn"
          >
            {createLoading ? <Spinner animation="border" size="sm" /> : 'Submit Review'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AddReviewForm;