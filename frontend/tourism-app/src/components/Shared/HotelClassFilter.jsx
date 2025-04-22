// src/pages/Shared/HotelClassFilter.jsx
import React, { useState } from 'react';
import { Form } from 'react-bootstrap';

const HotelClassFilter = ({ onClassChange }) => {
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
    <div className="class-filter">
      <h5>Filter by Stars</h5>
      <Form.Check
        type="checkbox"
        label="1 Star"
        value="oneStar"
        onChange={handleChange}
        checked={selectedClasses.includes('oneStar')}
      />
      <Form.Check
        type="checkbox"
        label="2 Stars"
        value="twoStars"
        onChange={handleChange}
        checked={selectedClasses.includes('twoStars')}
      />
      <Form.Check
        type="checkbox"
        label="3 Stars"
        value="threeStars"
        onChange={handleChange}
        checked={selectedClasses.includes('threeStars')}
      />
      <Form.Check
        type="checkbox"
        label="4 Stars"
        value="fourStars"
        onChange={handleChange}
        checked={selectedClasses.includes('fourStars')}
      />
      <Form.Check
        type="checkbox"
        label="5 Stars"
        value="fiveStars"
        onChange={handleChange}
        checked={selectedClasses.includes('fiveStars')}
      />
    </div>
  );
};

export default HotelClassFilter;