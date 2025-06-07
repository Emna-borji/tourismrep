import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import AddReviewForm from './AddReviewForm';

const ReviewSection = ({
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
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex justify-center items-center min-h-[200px]">
      {!showForm && (
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          className="submit-btn"
        >
          Ajouter un commentaire
        </Button>
      )}
      {showForm && (
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
      )}
    </div>
  );
};

export default ReviewSection;