import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import './sortDropDownStyle.css';

const SortDropDown = ({ onSortChange, className }) => {
  const [selectedOption, setSelectedOption] = useState('Choisissez le tri');
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = (option) => {
    setSelectedOption(option);
    if (onSortChange) {
      onSortChange(option);
    }
  };

  return (
    <div className={`tourism-sort-container ${className}`}>
      <Form.Label className="tourism-sort-label">Trier par prix</Form.Label>
      <Dropdown
        onToggle={(isOpen) => setIsFocused(isOpen)}
        className={`tourism-sort-dropdown ${isFocused ? 'tourism-focused' : ''}`}
      >
        <Dropdown.Toggle className="tourism-sort-toggle">
          {selectedOption}
          <FaChevronDown className="tourism-chevron-icon" />
        </Dropdown.Toggle>
        <Dropdown.Menu className="tourism-sort-menu">
          <Dropdown.Item
            className={selectedOption === 'Choisissez le tri' ? 'tourism-selected' : ''}
            onClick={() => handleSelect('Choisissez le tri')}
          >
            Choisissez le tri
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedOption === 'Prix croissant' ? 'tourism-selected' : ''}
            onClick={() => handleSelect('Prix croissant')}
          >
            Prix croissant
          </Dropdown.Item>
          <Dropdown.Item
            className={selectedOption === 'Prix décroissant' ? 'tourism-selected' : ''}
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