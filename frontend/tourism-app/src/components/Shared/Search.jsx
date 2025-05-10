import React, { useState } from 'react';
import { Form, InputGroup, FormControl, Button } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './searchStyle.css';
import { saveSearch } from '../../redux/actions/searchActions';

const Search = ({ onSearch, entityType, className }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const { loading: saveSearchLoading, error: saveSearchError } = useSelector((state) => state.saveSearch);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      if (!userInfo) {
        console.log('User not authenticated, skipping search save');
        return;
      }
      dispatch(saveSearch(query, entityType));
      if (saveSearchError) {
        console.error('Error saving search:', saveSearchError);
        if (saveSearchError.includes('401')) {
          navigate('/login');
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className={`tourism-search-container ${className}`}>
      <Form className="tourism-search-form" onSubmit={handleSearch}>
        <InputGroup className={`tourism-search-group ${isFocused ? 'tourism-focused' : ''}`}>
          <FormControl
            placeholder={`Rechercher par nom de ${entityType || 'entité'}`}
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="tourism-search-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <InputGroup.Text className="tourism-search-icon">
            <FaSearch />
          </InputGroup.Text>
          <Button
            variant="primary"
            type="submit"
            className="tourism-search-button"
            disabled={saveSearchLoading}
          >
            {saveSearchLoading ? 'Chargement...' : 'Rechercher'}
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
};

export default Search;