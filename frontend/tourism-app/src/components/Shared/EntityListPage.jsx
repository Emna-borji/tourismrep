// src/pages/EntityListPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container } from 'react-bootstrap';
import ItemListPage from './ItemListPage';
import Search from './Search.jsx';
import SortDropDown from './SortDropDown.jsx';
import DestinationDropdown from './DestinationDropdown.jsx';
import RestaurantClassFilter from './RestaurantClassFilter.jsx';
import GuestHouseCategoryFilter from './GuestHouseCategoryFilter.jsx';
import MapDisplay from './MapDisplay.jsx';
import HotelClassFilter from './HotelClassFilter.jsx';
import { fetchEntities, fetchCuisines } from '../../redux/actions/entityActions.js';
import { Form as BootstrapForm } from 'react-bootstrap';

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
  const [destinationId, setDestinationId] = useState(null); // Use destinationId instead of destination
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedDestinationId = useDebounce(destinationId, 500);
  const debouncedCuisine = useDebounce(cuisine, 500);
  const debouncedCategory = useDebounce(category, 500);

  useEffect(() => {
    const params = {
      searchQuery: debouncedSearchQuery,
      sortOption,
      destination_id: debouncedDestinationId, // Use destination_id
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
  }, [dispatch, entityType, debouncedSearchQuery, sortOption, debouncedDestinationId, selectedClasses, debouncedCuisine, debouncedCategory]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleDestinationChange = (destinationId) => {
    setDestinationId(destinationId); // Receives destination_id (e.g., 23 or null)
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

  return (
    <Container>
      <div className="search-sort-destination-container">
        <Search onSearch={handleSearch} entityType={entityType} />
        <SortDropDown onSortChange={handleSortChange} />
        <DestinationDropdown onDestinationChange={handleDestinationChange} />
        {entityType === 'restaurant' && (
          <div className="cuisine-filter">
            <BootstrapForm.Select
              value={cuisine}
              onChange={handleCuisineChange}
              className="form-control"
              disabled={cuisinesLoading}
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
        {entityType === 'guest_house' && (
          <GuestHouseCategoryFilter onCategoryChange={handleCategoryChange} />
        )}
      </div>

      <div className="map-class-container">
        <MapDisplay />
        {entityType === 'restaurant' && <RestaurantClassFilter onClassChange={handleClassChange} />}
        {entityType === 'hotel' && <HotelClassFilter onClassChange={handleClassChange} />}
      </div>

      <ItemListPage
        items={entities}
        loading={loading}
        error={error}
        itemType={itemType}
        itemDetailsRoute={itemDetailsRoute}
        entityType={entityType}
      />
    </Container>
  );
};

export default EntityListPage;