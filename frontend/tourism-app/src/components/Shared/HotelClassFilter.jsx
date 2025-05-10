import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import './hotelClassFilterStyle.css';

const HotelClassFilter = ({ onClassChange, className }) => {
  const [selectedClasses, setSelectedClasses] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    let updatedClasses;

    if (e.target.checked) {
      updatedClasses = [...selectedClasses, value];
    } else {
      updatedClasses = selectedClasses.filter((item) => item !== value);
    }

    setSelectedClasses(updatedClasses);
    onClassChange(updatedClasses);
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
          checked={selectedClasses.includes('oneStar')}
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
          checked={selectedClasses.includes('twoStars')}
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
          checked={selectedClasses.includes('threeStars')}
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
          checked={selectedClasses.includes('fourStars')}
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
          checked={selectedClasses.includes('fiveStars')}
          className="tourism-class-checkbox"
        />
      </div>
    </div>
  );
};

export default HotelClassFilter;