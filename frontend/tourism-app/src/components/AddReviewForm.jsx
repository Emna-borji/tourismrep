import React, { useEffect, useState } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import './addReviewForm.css';

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
  const { userInfo } = useSelector((state) => state.auth);
  const [showRatingError, setShowRatingError] = useState(false);

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

  // Handle form submission to check for rating
  const onSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setShowRatingError(true);
    } else {
      handleReviewSubmit(e);
    }
  };

  // Handle form reset (Annuler button)
  const handleCancel = () => {
    setRating(0);
    setComment('');
    setImage(null);
    setShowRatingError(false);
  };

  // Hide the error message after 3 seconds
  useEffect(() => {
    if (showRatingError) {
      const timer = setTimeout(() => {
        setShowRatingError(false);
      }, 3000);
      return () => clearTimeout(timer); // Cleanup on unmount or if showRatingError changes
    }
  }, [showRatingError]);

  // Construct the full name from firstname and lastname
  const fullName = userInfo?.firstname && userInfo?.lastname 
    ? `${userInfo.firstname} ${userInfo.lastname}` 
    : userInfo?.firstname || userInfo?.lastname || 'Utilisateur';

  // Determine the profile picture source
  const profilePicSrc = userInfo?.profilepic || 'https://i.pinimg.com/736x/98/1d/6b/981d6b2e0ccb5e968a0618c8d47671da.jpg';

  return (
    <div className="add-review-form" style={{ padding: '24px' }}>
      {/* Section utilisateur (photo + nom + rôle) */}
      <div className="user-section">
        <img
          src={profilePicSrc}
          alt="Utilisateur"
          className="profile-pic"
        />
        <div className="user-info">
          <div className="name-and-stars">
            <h5 className="user-name">{fullName}</h5>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={star <= rating ? 'active' : ''}
                  onClick={() => setRating(star)}
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
            </div>
          </div>
          <p className="user-role">{userInfo?.role === "admin" ? "Admin" : "Utilisateur"}</p>
        </div>
      </div>

      {createError && <Alert variant="danger">{createError}</Alert>}
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Note (Obligatoire)</Form.Label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={star <= rating ? 'active' : ''}
                onClick={() => setRating(star)}
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
          </div>
          {showRatingError && (
            <div
              role="alert"
              className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 mt-2"
            >
              <svg
                stroke="currentColor"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 flex-shrink-0 mr-2 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-xs font-semibold">Erreur - Veuillez sélectionner une note.</p>
            </div>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Commentaire</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Télécharger une image (Optionnel)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {image && (
            <div className="mt-2 image-preview">
              <img src={image} alt="Prévisualisation" style={{ maxWidth: '200px', maxHeight: '200px' }} />
            </div>
          )}
        </Form.Group>
        <div className="button-group">
          <Button
            type="submit"
            disabled={createLoading || !isFormValid}
            className="submit-btn"
          >
            {createLoading ? <Spinner animation="border" size="sm" /> : 'Soumettre le commentaire'}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleCancel}
            className="cancel-btn"
          >
            Annuler
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddReviewForm;