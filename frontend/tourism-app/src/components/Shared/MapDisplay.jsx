import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import { Modal } from 'react-bootstrap';
import 'leaflet/dist/leaflet.css';
import './mapDisplayStyle.css';

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapDisplay = ({ onPlaceClick }) => {
  const dispatch = useDispatch();
  const { destinations, loading, error } = useSelector((state) => state.destinations || { destinations: [], loading: false, error: null });
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    dispatch(fetchDestinations());
  }, [dispatch]);

  const tunisiaBounds = [[30.2, 7.5], [37.3, 11.6]]; // Tunisia bounding box

  if (loading) return <div>Loading map...</div>;
  if (error) return <div>Error loading map: {error}</div>;

  const handleMapClick = () => {
    setShowMapModal(true);
  };

  return (
    <>
      <div className="map-container" onClick={handleMapClick}>
        <MapContainer
          center={[34.0, 9.5]} // Center of Tunisia
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          bounds={tunisiaBounds}
          boundsOptions={{ padding: [50, 50] }}
          dragging={false} // Disable dragging
          touchZoom={false} // Disable touch zoom
          scrollWheelZoom={false} // Disable scroll zoom
          doubleClickZoom={false} // Disable double-click zoom
          boxZoom={false} // Disable box zoom
          keyboard={false} // Disable keyboard navigation
          zoomControl={false} // Hide zoom controls
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {destinations.map((destination) => (
            destination.latitude && destination.longitude && (
              <Marker
                key={destination.id}
                position={[destination.latitude, destination.longitude]}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation(); // Prevent modal from opening when clicking a marker
                    onPlaceClick(destination);
                  },
                }}
              >
                <Popup>{destination.name}</Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Modal for interactive map navigation */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="lg"
        centered
        dialogClassName="map-navigation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Naviguez sur la carte</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="map-container-modal">
            <MapContainer
              center={[34.0, 9.5]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              bounds={tunisiaBounds}
              boundsOptions={{ padding: [50, 50] }}
              dragging={true} // Enable dragging
              touchZoom={true} // Enable touch zoom
              scrollWheelZoom={true} // Enable scroll zoom
              doubleClickZoom={true} // Enable double-click zoom
              boxZoom={true} // Enable box zoom
              keyboard={true} // Enable keyboard navigation
              zoomControl={true} // Show zoom controls
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {destinations.map((destination) => (
                destination.latitude && destination.longitude && (
                  <Marker
                    key={destination.id}
                    position={[destination.latitude, destination.longitude]}
                    eventHandlers={{
                      click: () => {
                        onPlaceClick(destination);
                        setShowMapModal(false); // Close the navigation modal after selecting a place
                      },
                    }}
                  >
                    <Popup>{destination.name}</Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MapDisplay;