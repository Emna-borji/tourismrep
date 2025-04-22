import React from 'react';
import './mapDisplayStyle.css';

const MapDisplay = () => {
  return (
    <div className="map-container">
      <img
        src="https://www.google.com/maps/vt/data=EKdi6enOWc-k71qi386EyNxoPSLRi-rOvBXpRnCMmzvnkiF2Tt0a3hloEYZykAegs5i7ZqM8kzQle_ZuhlygRe9hOe0KwclWXQ3k20wUH7NWa53D-RVLqvVdAZ7iIwxQpPOE1uHCxJUe8YY8rf8F_GrgO-_3kZUOcTgWmxLUyhv1cTEMNQ_vNe4RB9HmzCbtdW6EkCG9wcrZ8rtRxGQo9rEzFCQmhHkjOS9Ie_1e8QqHqTq_27SGf-ifwH92CNNsWXmEMd1tBKLJek9rqehtkdZhNp-lqD-nkPd098JOWg" // Replace with actual map image URL
        alt="Map of Tunisia"
        className="map-image"
      />
    </div>
  );
};

export default MapDisplay;