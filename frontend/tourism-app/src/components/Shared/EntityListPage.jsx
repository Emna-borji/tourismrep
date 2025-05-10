import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container } from 'react-bootstrap';
import ItemListPage from './ItemListPage';
import Navbar from './Navbar';
import Search from './Search.jsx';
import SortDropDown from './SortDropDown.jsx';
import DestinationDropdown from './DestinationDropdown.jsx';
import RestaurantClassFilter from './RestaurantClassFilter.jsx';
import GuestHouseCategoryFilter from './GuestHouseCategoryFilter.jsx';
import MapDisplay from './MapDisplay.jsx';
import HotelClassFilter from './HotelClassFilter.jsx';
import { fetchEntities, fetchCuisines } from '../../redux/actions/entityActions.js';
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
  const { entities, loading, error, cuisines, cuisinesLoading } = useSelector((state) => state.entities);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Choisissez le tri');
  const [destinationId, setDestinationId] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 15;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedDestinationId = useDebounce(destinationId, 500);
  const debouncedCuisine = useDebounce(cuisine, 500);
  const debouncedCategory = useDebounce(category, 500);

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

    console.log('Dispatching fetchEntities with params:', params);
    dispatch(fetchEntities(entityType, params));
    if (entityType === 'restaurant') {
      dispatch(fetchCuisines());
    }
    setCurrentPage(1);
  }, [dispatch, entityType, debouncedSearchQuery, sortOption, debouncedDestinationId, selectedClasses, debouncedCuisine, debouncedCategory]);

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
    console.log('Category changed to:', category);
    setCategory(category);
  };

  const totalPages = Math.ceil(entities.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const displayedEntities = entities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Get hero section config based on entityType, with fallback to defaults
  const heroConfig = entityHeroConfig[entityType] || {
    image: 'https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e83ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png',
    title: 'Explorez la Tunisie',
    subtitle: 'Découvrez les meilleures destinations touristiques',
  };

  return (
    <>
      <Navbar />
      <HeroSection
        image={heroConfig.image}
        title={heroConfig.title}
        subtitle={heroConfig.subtitle}
      />
      <Container className="tourism-container">
        <div className="tourism-main-layout">
          <div className="tourism-left-column">
            <div className="tourism-filter-group">
              <DestinationDropdown onDestinationChange={handleDestinationChange} className="tourism-destination-dropdown" />
              <SortDropDown onSortChange={handleSortChange} className="tourism-sort-dropdown" />
              {entityType === 'guest_house' && (
                <GuestHouseCategoryFilter onCategoryChange={handleCategoryChange} className="tourism-guest-house-category-filter" />
              )}
            </div>
            <MapDisplay className="tourism-map-display" />
            {entityType === 'restaurant' && <RestaurantClassFilter onClassChange={handleClassChange} className="tourism-restaurant-class-filter" />}
            {entityType === 'hotel' && <HotelClassFilter onClassChange={handleClassChange} className="tourism-hotel-class-filter" />}
          </div>
          <div className="tourism-right-column">
            <div className="tourism-search-filter-group">
              <Search onSearch={handleSearch} entityType={entityType} className="tourism-search-bar" />
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
                  className="tourism-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    className={`tourism-pagination-btn ${currentPage === number ? 'tourism-pagination-active' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
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
    </>
  );
};

export default EntityListPage;