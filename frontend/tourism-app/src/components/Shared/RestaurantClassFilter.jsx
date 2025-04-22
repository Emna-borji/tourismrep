import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaUtensils } from 'react-icons/fa'; // Using utensils icon to represent forks
import './restaurantClassFilterStyle.css';

const RestaurantClassFilter = ({ onClassChange }) => {
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

    // Pass the selected classes to the parent component
    const selected = Object.keys(updatedClasses).filter((key) => updatedClasses[key]);
    if (onClassChange) {
      onClassChange(selected);
    }
  };

  return (
    <div className="class-filter-container">
      <Form.Label className="class-filter-label">Classe de restaurant</Form.Label>
      <div className="checkbox-group">
        <Form.Check
          type="checkbox"
          label={
            <span>
              <FaUtensils /> {/* 1 fork */}
            </span>
          }
          checked={selectedClasses.oneFork}
          onChange={() => handleCheckboxChange('oneFork')}
          className="class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span>
              <FaUtensils /> <FaUtensils /> {/* 2 forks */}
            </span>
          }
          checked={selectedClasses.twoForks}
          onChange={() => handleCheckboxChange('twoForks')}
          className="class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span>
              <FaUtensils /> <FaUtensils /> <FaUtensils /> {/* 3 forks */}
            </span>
          }
          checked={selectedClasses.threeForks}
          onChange={() => handleCheckboxChange('threeForks')}
          className="class-checkbox"
        />
      </div>
    </div>
  );
};

export default RestaurantClassFilter;