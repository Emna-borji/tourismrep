import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './touristMap.css';
import { fetchMapEntities } from '../redux/actions/entityActions'; // Updated import

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Main entity icon (used as fallback)
const mainEntityIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom icons for entity types
const entityIcons = {
  activity: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/activity-icon.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  archaeological_site: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2282/2282197.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  festival: new L.Icon({
    iconUrl: 'https://cdn0.iconfinder.com/data/icons/new-normal-music-festival-2/512/28.Placeholder-512.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  guest_house: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/maison-hote.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  hotel: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/hotel-icon.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  museum: new L.Icon({
    iconUrl: 'https://tunisiagotravel.com/mapMarkers/musee.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
  restaurant: new L.Icon({
    iconUrl: 'https://png.pngtree.com/png-vector/20241227/ourmid/pngtree-restaurant-location-pin-icon-vector-png-image_14906347.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  }),
};

const TouristMap = () => {
  const dispatch = useDispatch();
  const { entities, loading, error } = useSelector((state) => state.entities || { entities: [], loading: false, error: null }); // Match initial state
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const defaultCenter = [36.8065, 10.1815]; // Tunis, Tunisia

  useEffect(() => {
    // Fetch all entity types initially with the new action
    ['activity', 'archaeological_site', 'festival', 'guest_house', 'hotel', 'museum', 'restaurant'].forEach((type) => {
      dispatch(fetchMapEntities(type, { searchQuery }));
    });
  }, [dispatch, searchQuery]);

  const handleFilterChange = (e) => {
    const type = e.target.value;
    setSelectedEntityType(type);
    if (type) {
      dispatch(fetchMapEntities(type, { searchQuery }));
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading) return <div className="text-center text-gray-600 p-6">Chargement de la carte...</div>;
  if (error) return <div className="text-center text-red-500 p-6">Erreur: {error}</div>;

  // Determine filtered entities
  const filteredEntities = selectedEntityType
    ? (entities.filter(entity => entity.entity_type === selectedEntityType) || [])
    : entities;

  // Debug the entities data
  console.log('Entities State:', entities);
  console.log('Filtered Entities:', filteredEntities);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Filtres</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type d'attraction</label>
            <select
              value={selectedEntityType}
              onChange={handleFilterChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tous</option>
              <option value="activity">Activités</option>
              <option value="archaeological_site">Sites archéologiques</option>
              <option value="festival">Festivals</option>
              <option value="guest_house">Gîtes</option>
              <option value="hotel">Hôtels</option>
              <option value="museum">Musées</option>
              <option value="restaurant">Restaurants</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recherche</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher..."
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-3/4 h-full">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          className="h-full w-full rounded-lg shadow-md border border-gray-200"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredEntities.length > 0 ? (
            filteredEntities.map((entity) => (
              entity.latitude && entity.longitude && !isNaN(entity.latitude) && !isNaN(entity.longitude) && (
                <Marker
                  key={entity.id}
                  position={[entity.latitude, entity.longitude]}
                  icon={entityIcons[entity.entity_type] || mainEntityIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-3">
                      <h3 className="font-bold text-lg text-blue-800">{entity.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{entity.address || 'Adresse non disponible'}</p>
                      {entity.price && <p className="text-green-600 font-semibold text-md">À partir de {entity.price} DT</p>}
                    </div>
                  </Popup>
                </Marker>
              )
            ))
          ) : (
            <div className="text-center text-gray-600 p-4">Aucun marqueur à afficher</div>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default TouristMap;