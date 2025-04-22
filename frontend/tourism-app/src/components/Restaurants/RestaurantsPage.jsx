import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../../redux/actions/restaurantActions';
import { Container } from 'react-bootstrap';
import ItemListPage from '../Shared/ItemListPage';
import Search from '../Shared/Search.jsx';
import SortDropDown from '../Shared/SortDropDown.jsx';
import DestinationDropdown from '../Shared/DestinationDropdown.jsx';
import RestaurantClassFilter from '../Shared/RestaurantClassFilter.jsx';
import MapDisplay from '../Shared/MapDisplay.jsx';
import './RestaurantsPage.css';

// Custom hook for debouncing
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

const RestaurantsPage = () => {
  const dispatch = useDispatch();
  const { restaurants, loading, error } = useSelector((state) => state.restaurants);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Choisissez le tri');
  const [destination, setDestination] = useState('Choisissez votre destination');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search input
  const debouncedDestination = useDebounce(destination, 500);

  useEffect(() => {
    const forks = selectedClasses
      .map((forkClass) => {
        if (forkClass === 'oneFork') return 1;
        if (forkClass === 'twoForks') return 2;
        if (forkClass === 'threeForks') return 3;
        return null;
      })
      .filter((fork) => fork !== null)
      .join(',');

    dispatch(
      fetchRestaurants({
        searchQuery: debouncedSearchQuery,
        sortOption,
        destination: debouncedDestination === 'Choisissez votre destination' ? '' : debouncedDestination,
        forks: forks || undefined,
      })
    );
  }, [dispatch, debouncedSearchQuery, sortOption, debouncedDestination, selectedClasses]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleDestinationChange = (destination) => {
    setDestination(destination);
  };

  const handleClassChange = (classes) => {
    setSelectedClasses(classes);
  };

  return (
    <Container>
      <div className="search-sort-destination-container">
        <Search onSearch={handleSearch} />
        <SortDropDown onSortChange={handleSortChange} />
        <DestinationDropdown onDestinationChange={handleDestinationChange} />
      </div>

      <div className="map-class-container">
        <MapDisplay />
        <RestaurantClassFilter onClassChange={handleClassChange} />
      </div>

      <ItemListPage
        fetchItems={fetchRestaurants}
        items={restaurants}
        loading={loading}
        error={error}
        itemType="Restaurants"
        itemDetailsRoute="restaurant"
        entityType="restaurant" // Pass entityType
      />
    </Container>
  );
};

export default RestaurantsPage;