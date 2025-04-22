// src/components/EntityLocationMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './entityLocationMap.css';

const EntityLocationMap = ({ entity }) => {
  // Check if the entity has valid coordinates
  if (!entity.latitude || !entity.longitude) {
    return (
      <div className="entity-location-map-container">
        <p className="text-muted">Carte de localisation indisponible : coordonnées non trouvées.</p>
      </div>
    );
  }

  const position = [entity.latitude, entity.longitude];

  return (
    <div className="entity-location-map-container">
      <MapContainer center={position} zoom={15} style={{ height: '200px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>'
        />
        <Marker position={position}>
          <Popup>
            <strong>{entity.name}</strong>
            <br />
            {entity.address && `Adresse: ${entity.address}`}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default EntityLocationMap;