// src/utils/renderIcons.js
import React from 'react';
import { FaStar, FaUtensils } from 'react-icons/fa';

// Render stars (e.g., for hotels)
export const renderStars = (rating, max = 5) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <FaStar
        key={i}
        color={i <= rating ? '#FFD700' : '#D3D3D3'} // Gold for filled, gray for unfilled
        size={16}
        className="me-1"
      />
    );
  }
  return stars;
};

// Render forks (e.g., for restaurants)
export const renderForks = (forks, max = 3) => {
  const forkIcons = [];
  for (let i = 1; i <= max; i++) {
    forkIcons.push(
      <FaUtensils
        key={i}
        color={i <= forks ? '#FFD700' : '#D3D3D3'} // Gold for filled, gray for unfilled
        size={16}
        className="me-1"
      />
    );
  }
  return forkIcons;
};