import React, { useState, useEffect } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import './destinationDropdownStyle.css';

const DestinationDropdown = ({ onDestinationChange, className }) => {
  const dispatch = useDispatch();
  const { destinations, loading, error } = useSelector((state) => state.destinations);
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
    <div className={`tourism-destination-container ${className}`}>
      <Form.Label className="tourism-destination-label">Cherchez par destination</Form.Label>
      {loading && <p>Loading destinations...</p>}
      {error && <p>Error: {error}</p>}
      <Dropdown
        onToggle={(isOpen) => setIsFocused(isOpen)}
        className={`tourism-destination-dropdown ${isFocused ? 'tourism-focused' : ''}`}
      >
        <Dropdown.Toggle className="tourism-destination-toggle">
          {selectedDestinationName}
          <FaChevronDown className="tourism-chevron-icon" />
        </Dropdown.Toggle>
        <Dropdown.Menu className="tourism-destination-menu">
          <Dropdown.Item
            key="placeholder"
            className={selectedDestinationId === '' ? 'tourism-selected' : ''}
            onClick={() => handleSelect('')}
          >
            Choisissez votre destination
          </Dropdown.Item>
          {destinations.map((destination) => (
            <Dropdown.Item
              key={destination.id}
              className={selectedDestinationId === String(destination.id) ? 'tourism-selected' : ''}
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