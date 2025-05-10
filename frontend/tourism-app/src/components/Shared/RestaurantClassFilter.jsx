import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaUtensils } from 'react-icons/fa';
import './restaurantClassFilterStyle.css';

const RestaurantClassFilter = ({ onClassChange, className }) => {
  const [selectedClasses, setSelectedClasses] = useState({
    oneFork: false,
    twoForks: false,
    threeForks: false,
  });

  const handleCheckboxChange = (forkClass) => {
    const updatedClasses = {
      ...selectedClasses,
      [forkClass]: !selectedClasses[forkClass],
    };
    setSelectedClasses(updatedClasses);

    const selected = Object.keys(updatedClasses).filter((key) => updatedClasses[key]);
    if (onClassChange) {
      onClassChange(selected);
    }
  };

  return (
    <div className={`tourism-restaurant-class-filter ${className}`}>
      <Form.Label className="tourism-class-filter-label">Classe de restaurant</Form.Label>
      <div className="tourism-checkbox-group">
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-fork-label">
              <FaUtensils className="tourism-fork-icon" />
            </span>
          }
          checked={selectedClasses.oneFork}
          onChange={() => handleCheckboxChange('oneFork')}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-fork-label">
              <FaUtensils className="tourism-fork-icon" />
              <FaUtensils className="tourism-fork-icon" />
            </span>
          }
          checked={selectedClasses.twoForks}
          onChange={() => handleCheckboxChange('twoForks')}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-fork-label">
              <FaUtensils className="tourism-fork-icon" />
              <FaUtensils className="tourism-fork-icon" />
              <FaUtensils className="tourism-fork-icon" />
            </span>
          }
          checked={selectedClasses.threeForks}
          onChange={() => handleCheckboxChange('threeForks')}
          className="tourism-class-checkbox"
        />
      </div>
    </div>
  );
};

export default RestaurantClassFilter;