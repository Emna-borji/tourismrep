import React from 'react';
import { Card, Button } from 'react-bootstrap';
import './recommendationCard.css';

// Custom CSS for enhanced styling
const cardStyles = `
  .recommendation-card {
    border: none;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    background: #fff;
  }
  .recommendation-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  .recommendation-card img {
    object-fit: cover;
    height: 200px;
    width: 100%;
  }
  .placeholder-img {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    color: #666;
    font-size: 1rem;
    font-weight: 500;
  }
  .card-body {
    padding: 1.5rem;
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a3c34;
    margin-bottom: 1rem;
  }
  .card-text {
    font-size: 0.95rem;
    color: #333;
    margin-bottom: 0.75rem;
  }
  .card-text strong {
    color: #1a3c34;
    font-weight: 500;
  }
  .rating-stars {
    color: #f4c107;
    font-size: 1rem;
  }
  .rating-stars + span {
    color: #ccc;
  }
  .view-details-btn {
    background: #1a3c34;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.5rem;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  .view-details-btn:hover {
    background: #2a5c4a;
  }
`;

// Inject styles into the document
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = cardStyles;
document.head.appendChild(styleSheet);

// Debug: Confirm component is defined
console.log('RecommendationCard component loaded');

const RecommendationCard = ({ item, entityType }) => {
  // Debug: Log item and price to inspect data
  console.log('RecommendationCard item:', item);
  console.log('item.price:', item?.price, typeof item?.price);

  const getImageUrl = () => {
    if (item?.image) return item.image;
    if (item?.image_url) return item.image_url;
    if (entityType === 'restaurant' && item?.additional_images?.length > 0) {
      return item.additional_images[0].image_url;
    }
    return null;
  };

  const renderSpecificFields = () => {
    if (entityType === 'hotel') {
      return (
        <p className="card-text">
          <strong>Stars:</strong> {item?.stars ? `${item.stars} ⭐` : 'N/A'}
        </p>
      );
    }
    if (entityType === 'restaurant') {
      return (
        <p className="card-text">
          <strong>Forks:</strong> {item?.forks ? `${item.forks} 🍴` : 'N/A'}
        </p>
      );
    }
    if (entityType === 'festival') {
      return (
        <p className="card-text">
          <strong>Date:</strong> {item?.date || 'N/A'}
        </p>
      );
    }
    if (entityType === 'circuit') {
      return (
        <>
          <p className="card-text">
            <strong>Departure:</strong> {item?.departure_city || 'N/A'}
          </p>
          <p className="card-text">
            <strong>Arrival:</strong> {item?.arrival_city || 'N/A'}
          </p>
          <p className="card-text">
            <strong>Duration:</strong> {item?.duration ? `${item.duration} days` : 'N/A'}
          </p>
        </>
      );
    }
    return null;
  };

  // Safely handle price
  const formatPrice = (price) => {
    if (typeof price === 'number' && !isNaN(price)) {
      return `$${price.toFixed(2)}`;
    }
    if (typeof price === 'string') {
      const parsedPrice = parseFloat(price);
      if (!isNaN(parsedPrice)) {
        return `$${parsedPrice.toFixed(2)}`;
      }
    }
    return 'N/A';
  };

  return (
    <div className="col-md-4 mb-4">
      <Card className="recommendation-card shadow-sm">
        {getImageUrl() ? (
          <Card.Img
            variant="top"
            src={getImageUrl()}
            alt={item?.name}
          />
        ) : (
          <div className="placeholder-img">No Image Available</div>
        )}
        <Card.Body>
          <Card.Title>{item?.name || 'Unnamed'}</Card.Title>
          <p className="card-text">
            <strong>Destination:</strong> {item?.destination || 'N/A'}
          </p>
          <p className="card-text">
            <strong>Price:</strong> {formatPrice(item?.price)}
          </p>
          <p className="card-text">
            <strong>Rating:</strong>{' '}
            {item?.rating ? (
              <span className="rating-stars">
                {'★'.repeat(Math.round(item.rating))}
                <span>{'☆'.repeat(5 - Math.round(item.rating))}</span>
              </span>
            ) : (
              'No ratings'
            )}
          </p>
          {renderSpecificFields()}
          <Button
            className="view-details-btn"
            size="sm"
            href={`/details/${entityType}/${item?.id}`}
          >
            View Details
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

// Debug: Confirm export
console.log('Exporting RecommendationCard:', RecommendationCard, typeof RecommendationCard);

export default RecommendationCard;