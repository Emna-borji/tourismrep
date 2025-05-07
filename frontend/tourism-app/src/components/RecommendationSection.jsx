import React from 'react';
import { default as RecommendationCard } from './RecommendationCard';
import './recommendationSection.css';

// Debug: Confirm import
console.log('Imported RecommendationCard:', RecommendationCard, typeof RecommendationCard);

const RecommendationSection = ({ title, items = [], entityType }) => {
  if (!items || items.length === 0) {
    return (
      <div className="container my-5">
        <h2 className="section-title mb-4">{title}</h2>
        <p>No recommendations available for this category.</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="section-title mb-4">{title}</h2>
      <div className="row">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} entityType={entityType} />
        ))}
      </div>
    </div>
  );
};

// Debug: Confirm export
console.log('Exporting RecommendationSection:', RecommendationSection, typeof RecommendationSection);

export default RecommendationSection;