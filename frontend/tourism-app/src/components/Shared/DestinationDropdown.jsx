// src/components/DestinationDropdown.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import { fetchDestinations } from '../../redux/actions/destinationActions'; // Update import
import './destinationDropdownStyle.css';

const DestinationDropdown = ({ onDestinationChange }) => {
  const dispatch = useDispatch();
  const { destinations, loading, error } = useSelector((state) => state.destinations); // Read from state.destinations

  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    dispatch(fetchDestinations());
  }, [dispatch]);

  const selectedDestinationName = selectedDestinationId
    ? destinations.find((dest) => dest.id === parseInt(selectedDestinationId))?.name || 'Choisissez votre destination'
    : 'Choisissez votre destination';

  const handleSelect = (destinationId) => {
    setSelectedDestinationId(destinationId);
    if (onDestinationChange) {
      const idToPass = destinationId ? parseInt(destinationId) : null;
      onDestinationChange(idToPass);
    }
  };

  return (
    <div className="destination-container">
      <Form.Label className="destination-label">Recherche</Form.Label>
      {loading && <p>Loading destinations...</p>}
      {error && <p>Error: {error}</p>}
      <Dropdown
        onToggle={(isOpen) => setIsFocused(isOpen)}
        className={`custom-destination-dropdown ${isFocused ? 'focused' : ''}`}
      >
        <Dropdown.Toggle className="custom-destination-toggle">
          {selectedDestinationName}
          <FaChevronDown className="chevron-icon" />
        </Dropdown.Toggle>

        <Dropdown.Menu className="custom-destination-menu">
          <Dropdown.Item
            key="placeholder"
            className={selectedDestinationId === '' ? 'selected' : ''}
            onClick={() => handleSelect('')}
          >
            Choisissez votre destination
          </Dropdown.Item>
          {destinations.map((destination) => (
            <Dropdown.Item
              key={destination.id}
              className={selectedDestinationId === String(destination.id) ? 'selected' : ''}
              onClick={() => handleSelect(String(destination.id))}
            >
              {destination.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default DestinationDropdown;