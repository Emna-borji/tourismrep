// src/pages/Shared/GuestHouseCategoryFilter.jsx
import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import './GuestHouseCategoryFilter.css'; // Create a new CSS file for styling

const GuestHouseCategoryFilter = ({ onCategoryChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('Choisissez une catégorie'); // Default to neutral option
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = (category) => {
    console.log('Selected category:', category);
    setSelectedCategory(category);
    if (onCategoryChange) {
        const valueToPass = category === 'Choisissez une catégorie' ? '' : category;
        console.log('Passing to onCategoryChange:', valueToPass);
        onCategoryChange(valueToPass);
    }
  };

  return (
    <div className="category-filter-container">
      <Form.Label className="category-label">Filtrer par catégorie</Form.Label>
      <Dropdown
        onToggle={(isOpen) => setIsFocused(isOpen)}
        className={`custom-category-dropdown ${isFocused ? 'focused' : ''}`}
      >
        <Dropdown.Toggle className="custom-category-toggle">
          {selectedCategory}
          <FaChevronDown className="chevron-icon" />
        </Dropdown.Toggle>

        <Dropdown.Menu className="custom-category-menu">
          <Dropdown.Item
            className={selectedCategory === 'Choisissez une catégorie' ? 'selected' : ''}
            onClick={() => handleSelect('Choisissez une catégorie')}
          >
            Choisissez une catégorie
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedCategory === 'Luxe' ? 'selected' : ''}
            onClick={() => handleSelect('Luxe')}
          >
            Luxe
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedCategory === 'Moyenne gamme' ? 'selected' : ''}
            onClick={() => handleSelect('Moyenne gamme')}
          >
            Moyenne gamme
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedCategory === 'Économie' ? 'selected' : ''}
            onClick={() => handleSelect('Économie')}
          >
            Économie
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default GuestHouseCategoryFilter;