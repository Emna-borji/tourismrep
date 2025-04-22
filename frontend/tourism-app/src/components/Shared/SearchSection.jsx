import React from 'react';
import DestinationDropdown from './DestinationDropdown';
import MapDisplay from './MapDisplay';
import RestaurantClassFilter from './RestaurantClassFilter';
import './searchSectionStyle.css';

const SearchSection = ({ onDestinationChange, onClassChange }) => {
  return (
    <div className="search-section-container">
      <DestinationDropdown onDestinationChange={onDestinationChange} />
      <MapDisplay />
      <RestaurantClassFilter onClassChange={onClassChange} />
    </div>
  );
};

export default SearchSection;