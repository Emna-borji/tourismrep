import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './recommendationCard.css';

// Débogage : Confirmer que le composant est défini
console.log('Composant RecommendationCard chargé');

const RecommendationCard = ({ item, entityType }) => {
  // Débogage : Journaliser les données de l'item et du prix
  console.log('Item RecommendationCard :', item);
  console.log('Prix de l’item :', item?.price, typeof item?.price);

  const getImageUrl = () => {
  // If entityType is 'circuit', return the specified image URL
  if (entityType === 'circuit') {
    return 'https://levoyageur-organise.com/wp-content/uploads/2023/09/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg5NTI3NDEtaW1hZ2Uta3d2eDhja3IuanBn.jpg';
  }
  // Existing logic for other entity types
  if (item?.image) return item.image;
  if (item?.images) return item.images;
  if (item?.image_url) return item.image_url;
  if (entityType === 'restaurant' && item?.additional_images?.length > 0) {
    return item.additional_images[0].image_url;
  }
  // Fallback placeholder for non-circuit entities
  return 'https://tunisie.co/uploads/images/content/inspiring-220416-1.jpg'; // Placeholder cohérent
};

  const renderSpecificFields = () => {
    if (entityType === 'hotel') {
      return null; // Pas d'étoiles en bas pour les hôtels
    }
    if (entityType === 'restaurant') {
      return null; // Suppression des fourchettes en bas pour les restaurants
    }
    if (entityType === 'festival') {
      return (
        <p className="card-text custom-location">
          <strong>Date :</strong> {item?.date || 'N/A'}
        </p>
      );
    }
    if (entityType === 'circuit') {
      return (
        <>
          <p className="card-text custom-location">
            <strong>Départ :</strong> {item?.departure_city || 'N/A'}
          </p>
          <p className="card-text custom-location">
            <strong>Arrivée :</strong> {item?.arrival_city || 'N/A'}
          </p>
          <p className="card-text custom-location">
            <strong>Durée :</strong> {item?.duration ? `${item.duration} jours` : 'N/A'}
          </p>
        </>
      );
    }
    return null;
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

  const renderForks = (forks) => {
    return Array.from({ length: forks }, (_, i) => (
      <span key={i} className="fork">🍴</span>
    ));
  };

  // État fictif pour les favoris (remplacer par une logique réelle si nécessaire)
  const isFavorited = false; // Placeholder ; intégrer votre système de favoris

  return (
    <Card className="custom-card h-100 shadow-sm position-relative mb-3">
      <Card.Img
        variant="top"
        src={getImageUrl()}
        alt={item?.name}
        className="custom-card-img"
      />
      {(item?.forks || item?.stars) && (
        <div className="rating-badge-image">
          {entityType === 'restaurant' && item?.forks && renderForks(item.forks)}
          {entityType === 'hotel' && item?.stars && renderStars(item.stars)}
        </div>
      )}
      <Card.Body className="d-flex flex-column justify-content-between">
        <div>
          <Card.Title className="custom-title">{item?.name || 'Sans nom'}</Card.Title>
          {item.address && (
            <Card.Text className="custom-location">
              <span className="address-text">{item.address}</span>
            </Card.Text>
          )}
          {item.destination && (
            <Card.Text className="custom-region">
              {item.destination}
            </Card.Text>
          )}
          {entityType === 'guest_house' && item.category && (
            <Card.Text>
              Catégorie : {item.category}
            </Card.Text>
          )}
          {entityType === 'festival' && item.date && (
            <Card.Text>
              Date : {item.date}
            </Card.Text>
          )}
          <p className="card-text custom-location">
            <strong>Prix :</strong> {item?.price ? `${item.price} DT` : 'N/A'}
          </p>
          <p className="card-text custom-location">
            <strong>Note :</strong>{' '}
            {item?.rating ? (
              <span className="rating-stars">
                <FaStar className="rating-star" /> {item.rating}
              </span>
            ) : (
              'Aucune note'
            )}
          </p>
          {renderSpecificFields()}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          {item.price && (
            <div className="price-stack">
              <div className="price-prefix">à partir de</div>
              <div className="price-value"><strong>{item.price} DT</strong></div>
            </div>
          )}
          <Button
            as={Link}
            to={`/details/${entityType}/${item?.id}`}
            className="custom-details-btn"
          >
            Plus de détails
          </Button>
        </div>
      </Card.Body>
      <div className="favorite-icon" onClick={() => console.log('Favori basculé pour', item?.id)}>
        {isFavorited ? (
          <FaHeart color="red" size={24} />
        ) : (
          <FaRegHeart color="gray" size={24} />
        )}
      </div>
    </Card>
  );
};

// Débogage : Confirmer l’exportation
console.log('Exportation de RecommendationCard :', RecommendationCard, typeof RecommendationCard);

export default RecommendationCard;