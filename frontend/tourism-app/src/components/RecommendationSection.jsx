import React from 'react';
import { Row, Col } from 'react-bootstrap';
import RecommendationCard from './RecommendationCard';
import './recommendationSection.css';

// Debug: Confirm import
console.log('Imported RecommendationCard:', RecommendationCard, typeof RecommendationCard);

// Define a mapping of entityType to routes, handling pluralization and specific cases
const entityTypeToRoute = {
  circuit: '/predefined-circuits', // Maps to /predefined-circuits as per routes
  hotel: '/hotels',
  guest_house: '/guest_houses',
  restaurant: '/restaurants',
  activity: '/activities',
  museum: '/museums',
  festival: '/festivals',
  archaeological_site: '/archaeological_sites',
  guides: '/guides', // Add if applicable
  // Add more entity types as needed
};

const RecommendationSection = ({ title, items = [], entityType }) => {
  if (!items || items.length === 0) {
    return (
      <div className="container my-5">
        <h2 className="section-title mb-4">{title}</h2>
        <p className="no-items">No recommendations available for this category.</p>
      </div>
    );
  }

  // Determine the correct route based on entityType, fallback to '/' if not found
  const route = entityTypeToRoute[entityType.toLowerCase()] || '/';

  return (
    <div className="section-container">
      <h2 className="section-title mb-4">{title}</h2>
      <Row>
        {items.map((item) => (
          <Col xs={12} md={4} key={item.id} className="mb-4">
            <RecommendationCard item={item} entityType={entityType} />
          </Col>
        ))}
      </Row>
      {/* Dynamic "Voir Tout" link */}
      <a
        href={route}
        className="text-blue mt-4 underline font-bold text-sm flex justify-center"
      >
        Voir Tout
      </a>
    </div>
  );
};

// Debug: Confirm export
console.log('Exporting RecommendationSection:', RecommendationSection, typeof RecommendationSection);

export default RecommendationSection;