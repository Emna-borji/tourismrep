import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import './hotelClassFilterStyle.css';

const HotelClassFilter = ({ onClassChange, className }) => {
  const [selectedClass, setSelectedClass] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    let updatedClass;

    if (e.target.checked) {
      updatedClass = value; // Set the new class, overwriting the previous one
    } else {
      updatedClass = null; // If unchecked, clear the selection
    }

    setSelectedClass(updatedClass);
    onClassChange(updatedClass ? [updatedClass] : []); // Pass an array to maintain compatibility with the parent component
  };

  return (
    <div className={`tourism-hotel-class-filter ${className}`}>
      <Form.Label className="tourism-class-filter-label">Classe d'hôtel</Form.Label>
      <div className="tourism-checkbox-group">
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-star-label">
              <FaStar className="tourism-star-icon" />
            </span>
          }
          value="oneStar"
          onChange={handleChange}
          checked={selectedClass === 'oneStar'}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-star-label">
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
            </span>
          }
          value="twoStars"
          onChange={handleChange}
          checked={selectedClass === 'twoStars'}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-star-label">
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
            </span>
          }
          value="threeStars"
          onChange={handleChange}
          checked={selectedClass === 'threeStars'}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-star-label">
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
            </span>
          }
          value="fourStars"
          onChange={handleChange}
          checked={selectedClass === 'fourStars'}
          className="tourism-class-checkbox"
        />
        <Form.Check
          type="checkbox"
          label={
            <span className="tourism-star-label">
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
              <FaStar className="tourism-star-icon" />
            </span>
          }
          value="fiveStars"
          onChange={handleChange}
          checked={selectedClass === 'fiveStars'}
          className="tourism-class-checkbox"
        />
      </div>
    </div>
  );
};

export default HotelClassFilter;