// src/pages/Shared/SortDropDown.jsx
import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import './sortDropDownStyle.css';

const SortDropDown = ({ onSortChange }) => {
  const [selectedOption, setSelectedOption] = useState('Choisissez le tri'); // Default to neutral option
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = (option) => {
    setSelectedOption(option);
    if (onSortChange) {
      onSortChange(option);
    }
  };

  return (
    <div className="sort-container">
      <Form.Label className="sort-label">Trier par prix</Form.Label>
      <Dropdown
        onToggle={(isOpen) => setIsFocused(isOpen)}
        className={`custom-sort-dropdown ${isFocused ? 'focused' : ''}`}
      >
        <Dropdown.Toggle className="custom-sort-toggle">
          {selectedOption}
          <FaChevronDown className="chevron-icon" />
        </Dropdown.Toggle>

        <Dropdown.Menu className="custom-sort-menu">
          <Dropdown.Item
            className={selectedOption === 'Choisissez le tri' ? 'selected' : ''}
            onClick={() => handleSelect('Choisissez le tri')}
          >
            Choisissez le tri
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedOption === 'Prix croissant' ? 'selected' : ''}
            onClick={() => handleSelect('Prix croissant')}
          >
            Prix croissant
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedOption === 'Prix décroissant' ? 'selected' : ''}
            onClick={() => handleSelect('Prix décroissant')}
          >
            Prix décroissant
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default SortDropDown;