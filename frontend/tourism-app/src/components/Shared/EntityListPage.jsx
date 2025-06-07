import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ItemListPage from './ItemListPage';
import Search from './Search.jsx';
import SortDropDown from './SortDropDown.jsx';
import DestinationDropdown from './DestinationDropdown.jsx';
import RestaurantClassFilter from './RestaurantClassFilter.jsx';
import GuestHouseCategoryFilter from './GuestHouseCategoryFilter.jsx';
import MapDisplay from './MapDisplay.jsx';
import HotelClassFilter from './HotelClassFilter.jsx';
import { fetchEntities, fetchCuisines, fetchNearbyEntities, createEntity } from '../../redux/actions/entityActions.js';
import { fetchDestinations } from '../../redux/actions/destinationActions.js';
import { Form as BootstrapForm } from 'react-bootstrap';
import HeroSection from './HeroSection.jsx';
import './entityListPage.css';

// Entity-specific hero section configuration
const entityHeroConfig = {
  hotel: {
    image: 'https://digital.ihg.com/is/image/ihg/intercontinental-tegucigalpa-6071105521-2x1',
    title: 'Explorez les Hôtels de Tunisie',
    subtitle: 'Découvrez des séjours luxueux et confortables',
  },
  restaurant: {
    image: 'https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e83ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png',
    title: 'Savourez la Cuisine Tunisienne',
    subtitle: 'Découvrez les meilleurs restaurants locaux',
  },
  guest_house: {
    image: 'https://www.phgmag.com/wp-content/uploads/2020/07/PHG0820Art01Roberts01.jpg',
    title: 'Explorez les Maisons d’Hôtes de Tunisie',
    subtitle: 'Vivez une expérience authentique et chaleureuse',
  },
  festival: {
    image: 'https://media.istockphoto.com/id/1806011581/fr/photo/des-jeunes-gens-heureux-et-ravis-de-danser-de-sauter-et-de-chanter-pendant-le-concert-de-leur.jpg?s=612x612&w=0&k=20&c=d1GQ5j33_Ie7DBUM0gTxQcaPhkEIQxkBlWO0TLNPB8M=',
    title: 'Vivez les Festivals de Tunisie',
    subtitle: 'Plongez dans la culture et la fête',
  },
  activity: {
    image: 'https://www.pebbls.com/wp-content/uploads/2024/02/adventure-travel-header.jpg',
    title: 'Aventures en Tunisie',
    subtitle: 'Découvrez des activités passionnantes',
  },
  archaeological_site: {
    image: 'https://i0.wp.com/theluxurytravelexpert.com/wp-content/uploads/2020/05/top-10-ruins-archaelogical-sites-word-travel.jpg?fit=1600%2C900&ssl=1',
    title: 'Explorez les Sites Archéologiques de Tunisie',
    subtitle: 'Découvrez l’histoire ancienne du pays',
  },
  museum: {
    image: 'https://lp-cms-production.imgix.net/2019-06/b492455d0819654b7df1f38ee6947163-bardo-museum.jpg',
    title: 'Découvrez les Musées de Tunisie',
    subtitle: 'Explorez l’histoire et la culture tunisienne',
  },
};

// Translation mapping for itemType to French
const itemTypeTranslations = {
  Hotels: 'Hôtels',
  Restaurants: 'Restaurants',
  'Guest Houses': 'Maisons d’Hôtes',
  Festivals: 'Festivals',
  Activities: 'Activités',
  'Archaeological Sites': 'Sites Archéologiques',
  Museums: 'Musées',
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const EntityListPage = ({ entityType, itemType, itemDetailsRoute }) => {
  const dispatch = useDispatch();
  const { entities, loading, error, cuisines, cuisinesLoading, cuisinesError, nearbyEntities, nearbyLoading, nearbyError, createEntityLoading, createEntityError } = useSelector((state) => state.entities || {});
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector((state) => state.destinations || {});
  const { userInfo, loading: authLoading } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Choisissez le tri');
  const [destinationId, setDestinationId] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleNearbyEntities, setVisibleNearbyEntities] = useState(15);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const cardsPerPage = 15; // Define the missing constant
  const nearbyEntitiesPerPage = 15; // Define the missing constant
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedDestinationId = useDebounce(destinationId, 500);
  const debouncedCuisine = useDebounce(cuisine, 500);
  const debouncedCategory = useDebounce(category, 500);

  // Modal state and logic
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    latitude: '',
    longitude: '',
    address: '',
    destination_id: '',
    forks: '',
    cuisine_id: '',
    stars: '',
    category: '',
    date: '',
    period: '',
    site_type: '',
    hours: '',
    website: '',
    phone: '',
    equipments_ids: [],
  });

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setErrorMessage(null); // Clear error when closing modal
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const { name, latitude, longitude, price, destination_id } = formData;
    if (!name || !destination_id) {
      return "Tous les champs obligatoires (Nom, Destination) doivent être remplis.";
    }
    if (latitude && (parseFloat(latitude) < 32.0 || parseFloat(latitude) > 37.5)) {
      return "La latitude doit être entre 32.0 et 37.5 pour être en Tunisie.";
    }
    if (longitude && (parseFloat(longitude) < 7.5 || parseFloat(longitude) > 11.5)) {
      return "La longitude doit être entre 7.5 et 11.5 pour être en Tunisie.";
    }
    if (price && parseFloat(price) < 0) {
      return "Le prix ne peut pas être négatif.";
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const entityData = { ...formData };

    if (entityType === 'restaurant') {
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.equipments_ids;
      entityData.forks = parseInt(entityData.forks) || null;
      entityData.cuisine_id = parseInt(entityData.cuisine_id) || null;
    } else if (entityType === 'hotel') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      entityData.stars = parseInt(entityData.stars) || null;
      entityData.equipments_ids = entityData.equipments_ids.map(id => parseInt(id)) || [];
    } else if (entityType === 'guest_house') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      entityData.equipments_ids = entityData.equipments_ids.map(id => parseInt(id)) || [];
    } else if (entityType === 'festival') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    } else if (entityType === 'archaeological_site') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    } else if (entityType === 'museum') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.phone;
      delete entityData.equipments_ids;
    } else if (entityType === 'activity') {
      delete entityData.forks;
      delete entityData.cuisine_id;
      delete entityData.stars;
      delete entityData.category;
      delete entityData.date;
      delete entityData.period;
      delete entityData.site_type;
      delete entityData.hours;
      delete entityData.phone;
      delete entityData.website;
      delete entityData.equipments_ids;
    }

    entityData.price = parseFloat(entityData.price) || null;
    entityData.latitude = parseFloat(entityData.latitude) || null;
    entityData.longitude = parseFloat(entityData.longitude) || null;
    entityData.destination_id = parseInt(entityData.destination_id) || null;

    dispatch(createEntity(entityType, entityData)).then((response) => {
      if (response && response.error && response.error.non_field_errors) {
        setErrorMessage(response.error.non_field_errors[0]);
        setTimeout(() => setErrorMessage(null), 3000); // Clear after 3 seconds
      } else {
        handleCloseModal();
        setFormData({
          name: '',
          description: '',
          price: '',
          image: '',
          latitude: '',
          longitude: '',
          address: '',
          destination_id: '',
          forks: '',
          cuisine_id: '',
          stars: '',
          category: '',
          date: '',
          period: '',
          site_type: '',
          hours: '',
          website: '',
          phone: '',
          equipments_ids: [],
        });
      }
    });
  };

  useEffect(() => {
    dispatch(fetchDestinations());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erreur lors de la récupération de la localisation :', error);
          setUserLocation({ lat: null, lon: null });
        }
      );
    } else {
      console.error('La géolocalisation n’est pas prise en charge par ce navigateur.');
      setUserLocation({ lat: null, lon: null });
    }
  }, [dispatch]);

  useEffect(() => {
    const params = {
      searchQuery: debouncedSearchQuery,
      sortOption,
      destination_id: debouncedDestinationId,
    };

    if (entityType === 'restaurant') {
      const forks = selectedClasses
        .map((forkClass) => {
          if (forkClass === 'oneFork') return 1;
          if (forkClass === 'twoForks') return 2;
          if (forkClass === 'threeForks') return 3;
          return null;
        })
        .filter((fork) => fork !== null)
        .join(',');
      params.forks = forks || '';
      params.cuisine = debouncedCuisine || '';
    } else if (entityType === 'hotel') {
      const stars = selectedClasses
        .map((starClass) => {
          if (starClass === 'oneStar') return 1;
          if (starClass === 'twoStars') return 2;
          if (starClass === 'threeStars') return 3;
          if (starClass === 'fourStars') return 4;
          if (starClass === 'fiveStars') return 5;
          return null;
        })
        .filter((star) => star !== null)
        .join(',');
      params.stars = stars || '';
    } else if (entityType === 'guest_house') {
      params.category = debouncedCategory || '';
    }

    dispatch(fetchEntities(entityType, params));
    if (entityType === 'restaurant') {
      dispatch(fetchCuisines());
    }

    if (userLocation && userLocation.lat && userLocation.lon) {
      dispatch(fetchNearbyEntities(entityType, userLocation.lat, userLocation.lon));
    }
    setCurrentPage(1);
  }, [dispatch, entityType, debouncedSearchQuery, sortOption, debouncedDestinationId, selectedClasses, debouncedCuisine, debouncedCategory, userLocation]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleDestinationChange = (destinationId) => {
    setDestinationId(destinationId);
  };

  const handleClassChange = (classes) => {
    setSelectedClasses(classes);
  };

  const handleCuisineChange = (e) => {
    setCuisine(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setCategory(category);
  };

  const totalPages = Math.ceil((entities || []).length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const displayedEntities = (entities || []).slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowMoreNearby = () => {
    setVisibleNearbyEntities(prev => prev + nearbyEntitiesPerPage);
  };

  const handleShowLessNearby = () => {
    setVisibleNearbyEntities(nearbyEntitiesPerPage);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className="star" />);
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        stars.push(<FaStarHalfAlt key={i} className="star" />);
      } else {
        stars.push(<FaRegStar key={i} className="star" />);
      }
    }
    return stars;
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
  };

  const heroConfig = entityHeroConfig[entityType] || {
    image: 'https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e83ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png',
    title: 'Explorez la Tunisie',
    subtitle: 'Découvrez les meilleures destinations touristiques',
  };

  const translatedItemType = itemTypeTranslations[itemType] || itemType;

  return (
    <>
      <HeroSection
        image={heroConfig.image}
        title={heroConfig.title}
        subtitle={heroConfig.subtitle}
      />
      <Container className="tourism-container">
        <div className="tourism-main-layout">
          <div className="tourism-left-column">
            <div className="tourism-filter-group">
              {entityType === 'restaurant' && (
                <div className="tourism-cuisine-filter">
                  <BootstrapForm.Select
                    value={cuisine}
                    onChange={handleCuisineChange}
                    disabled={cuisinesLoading}
                    className="tourism-cuisine-filter-select"
                  >
                    <option value="">Choisissez une cuisine</option>
                    {cuisines.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </BootstrapForm.Select>
                </div>
              )}
              <DestinationDropdown onDestinationChange={handleDestinationChange} className="tourism-destination-dropdown" />
              {entityType === 'guest_house' && (
                <GuestHouseCategoryFilter onCategoryChange={handleCategoryChange} className="tourism-guest-house-category-filter" />
              )}
            </div>
            <MapDisplay onPlaceClick={handlePlaceClick} className="tourism-map-display" />
            {entityType === 'restaurant' && <RestaurantClassFilter onClassChange={handleClassChange} className="tourism-restaurant-class-filter" />}
            {entityType === 'hotel' && <HotelClassFilter onClassChange={handleClassChange} className="tourism-hotel-class-filter" />}
          </div>
          <div className="tourism-right-column">
            <div className="d-flex justify-content-between align-items-center mt-5">
              <h1 className="entity-title">{translatedItemType}</h1>
              {userInfo && userInfo.role === "admin" && (
                <Button
                  variant="success"
                  onClick={handleShowModal}
                  className="add-entity-btn"
                >
                  {entityType === 'activity' ? 'Ajouter Activité' : `Ajouter ${entityType === 'guest_house' ? 'Guest House' : translatedItemType.slice(0, -1)}`}
                </Button>
              )}
            </div>
            <Modal show={showModal} onHide={handleCloseModal} centered size="xl" className="tourism-modal">
              <Modal.Header>
                <Modal.Title>Ajouter {entityType === 'guest_house' ? 'Guest House' : translatedItemType.slice(0, -1)}</Modal.Title>
                <button className="tourism-modal-close-btn" onClick={handleCloseModal}>
                  <FaTimes />
                </button>
              </Modal.Header>
              <Modal.Body>
                {createEntityError && (
                  <div role="alert" className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 absolute top-4 right-4">
                    <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                    </svg>
                    <p className="text-xs font-semibold">{createEntityError}</p>
                  </div>
                )}
                {destinationsError && (
                  <div role="alert" className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 absolute top-4 right-4">
                    <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                    </svg>
                    <p className="text-xs font-semibold">Erreur lors du chargement des destinations : {destinationsError}</p>
                  </div>
                )}
                {cuisinesError && entityType === 'restaurant' && (
                  <div role="alert" className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 absolute top-4 right-4">
                    <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                    </svg>
                    <p className="text-xs font-semibold">Erreur lors du chargement des cuisines : {cuisinesError}</p>
                  </div>
                )}
                {errorMessage && (
                  <div role="alert" className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 absolute top-4 right-4">
                    <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
                    </svg>
                    <p className="text-xs font-semibold">{errorMessage}</p>
                  </div>
                )}
                <Form onSubmit={handleSubmit} className="tourism-entity-form">
                  <div className="tourism-form-sections">
                    {/* Basic Information Section */}
                    <div className="tourism-form-section">
                      <h3 className="tourism-form-section-title">Informations de Base</h3>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Nom *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Entrez le nom"
                          required
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Entrez une description"
                          rows={3}
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Prix</Form.Label>
                        <Form.Control
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Entrez le prix (ex: 150.00)"
                          step="0.01"
                          min="0"
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Image URL</Form.Label>
                        <Form.Control
                          type="text"
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          placeholder="Entrez l'URL de l'image"
                          className="tourism-form-input"
                        />
                      </Form.Group>
                    </div>

                    {/* Location Details Section */}
                    <div className="tourism-form-section">
                      <h3 className="tourism-form-section-title">Détails de Localisation</h3>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Latitude</Form.Label>
                        <Form.Control
                          type="number"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="Entrez la latitude (32.0 à 37.5)"
                          step="any"
                          min="32.0"
                          max="37.5"
                          required
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Longitude</Form.Label>
                        <Form.Control
                          type="number"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          placeholder="Entrez la longitude (7.5 à 11.5)"
                          step="any"
                          min="7.5"
                          max="11.5"
                          required
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Adresse</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Entrez l'adresse"
                          className="tourism-form-input"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 tourism-form-group">
                        <Form.Label>Destination *</Form.Label>
                        <Form.Select
                          name="destination_id"
                          value={formData.destination_id}
                          onChange={handleInputChange}
                          required
                          disabled={destinationsLoading || !destinations.length}
                          className="tourism-form-input"
                        >
                          <option value="">
                            {destinationsLoading ? 'Chargement des destinations...' : destinations.length ? 'Sélectionnez une destination' : 'Aucune destination disponible'}
                          </option>
                          {destinations.map((destination) => (
                            <option key={destination.id} value={destination.id}>
                              {destination.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>

                    {/* Entity-Specific Details Section */}
                    <div className="tourism-form-section">
                      <h3 className="tourism-form-section-title">Détails Spécifiques</h3>
                      {entityType === 'restaurant' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Fourchettes (1-3)</Form.Label>
                            <Form.Control
                              type="number"
                              name="forks"
                              value={formData.forks}
                              onChange={handleInputChange}
                              placeholder="Entrez le nombre de fourchettes (1-3)"
                              min="1"
                              max="3"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Cuisine</Form.Label>
                            <Form.Select
                              name="cuisine_id"
                              value={formData.cuisine_id}
                              onChange={handleInputChange}
                              disabled={cuisinesLoading || !cuisines.length}
                              className="tourism-form-input"
                            >
                              <option value="">
                                {cuisinesLoading ? 'Chargement des cuisines...' : cuisines.length ? 'Sélectionnez une cuisine' : 'Aucune cuisine disponible'}
                              </option>
                              {cuisines.map((cuisine) => (
                                <option key={cuisine.id} value={cuisine.id}>
                                  {cuisine.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Entrez le numéro de téléphone"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                      {entityType === 'hotel' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Étoiles (1-5)</Form.Label>
                            <Form.Control
                              type="number"
                              name="stars"
                              value={formData.stars}
                              onChange={handleInputChange}
                              placeholder="Entrez le nombre d'étoiles (1-5)"
                              min="1"
                              max="5"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Entrez le numéro de téléphone"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Site Web</Form.Label>
                            <Form.Control
                              type="text"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="Entrez l'URL du site web"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Équipements IDs (séparés par des virgules)</Form.Label>
                            <Form.Control
                              type="text"
                              name="equipments_ids"
                              value={formData.equipments_ids.join(',')}
                              onChange={(e) => setFormData({ ...formData, equipments_ids: e.target.value.split(',').map(id => id.trim()) })}
                              placeholder="Entrez les IDs des équipements (ex: 1,2,3)"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                      {entityType === 'guest_house' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Catégorie</Form.Label>
                            <Form.Select
                              name="category"
                              value={formData.category}
                              onChange={handleInputChange}
                              className="tourism-form-input"
                            >
                              <option value="">Sélectionnez une catégorie</option>
                              <option value="Basique">Basique</option>
                              <option value="Standard">Standard</option>
                              <option value="Premium">Premium</option>
                              <option value="Luxe">Luxe</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Entrez le numéro de téléphone"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Site Web</Form.Label>
                            <Form.Control
                              type="text"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="Entrez l'URL du site web"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Équipements IDs (séparés par des virgules)</Form.Label>
                            <Form.Control
                              type="text"
                              name="equipments_ids"
                              value={formData.equipments_ids.join(',')}
                              onChange={(e) => setFormData({ ...formData, equipments_ids: e.target.value.split(',').map(id => id.trim()) })}
                              placeholder="Entrez les IDs des équipements (ex: 1,2,3)"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                      {entityType === 'festival' && (
                        <Form.Group className="mb-3 tourism-form-group">
                          <Form.Label>Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="tourism-form-input"
                          />
                        </Form.Group>
                      )}
                      {entityType === 'archaeological_site' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Période</Form.Label>
                            <Form.Control
                              type="text"
                              name="period"
                              value={formData.period}
                              onChange={handleInputChange}
                              placeholder="Entrez la période (ex: Période romaine)"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Type de site</Form.Label>
                            <Form.Control
                              type="text"
                              name="site_type"
                              value={formData.site_type}
                              onChange={handleInputChange}
                              placeholder="Entrez le type de site (ex: Ruines)"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                      {entityType === 'museum' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Heures d’ouverture</Form.Label>
                            <Form.Control
                              type="text"
                              name="hours"
                              value={formData.hours}
                              onChange={handleInputChange}
                              placeholder="Entrez les heures d'ouverture (ex: 9h-17h)"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Site Web</Form.Label>
                            <Form.Control
                              type="text"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="Entrez l'URL du site web"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                      {entityType === 'activity' && (
                        <>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Entrez le numéro de téléphone"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3 tourism-form-group">
                            <Form.Label>Site Web</Form.Label>
                            <Form.Control
                              type="text"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="Entrez l'URL du site web"
                              className="tourism-form-input"
                            />
                          </Form.Group>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="tourism-form-actions">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={createEntityLoading}
                      className="tourism-form-submit-btn"
                    >
                      {createEntityLoading ? 'Ajout en cours...' : 'Ajouter'}
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal>
            <div className="tourism-search-filter-group">
              <div className="tourism-search-sort-group">
                <Search onSearch={handleSearch} entityType={entityType} className="tourism-search-bar" />
                <SortDropDown onSortChange={handleSortChange} className="tourism-sort-dropdown" />
              </div>
            </div>
            <ItemListPage
              items={displayedEntities}
              loading={loading}
              error={error}
              itemType={itemType}
              itemDetailsRoute={itemDetailsRoute}
              entityType={entityType}
              className="tourism-item-list-page"
            />
            {totalPages > 1 && (
              <div className="tourism-pagination-container">
                <button
                  type="button"
                  className="tourism-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    className={`tourism-pagination-btn ${currentPage === number ? 'tourism-pagination-active' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  className="tourism-pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      <Modal show={!!selectedPlace} onHide={() => setSelectedPlace(null)} centered>
        <Modal.Header>
          <Modal.Title>{selectedPlace?.name || 'Détails de la région'}</Modal.Title>
          <button className="tourism-modal-close-btn" onClick={() => setSelectedPlace(null)}>
            <FaTimes />
          </button>
        </Modal.Header>
        <Modal.Body>
          {selectedPlace && (
            <Link to={`/places/${selectedPlace.name.toLowerCase()}`} className="btn btn-primary">
              Découvrir {selectedPlace.name}
            </Link>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EntityListPage;