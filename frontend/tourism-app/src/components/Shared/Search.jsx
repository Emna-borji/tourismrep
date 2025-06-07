import React, { useState } from 'react';
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

  const handleChange = (e) => {
    // Remove numbers from the input value
    const value = e.target.value.replace(/[0-9]/g, '');
    setQuery(value);
  };

  return (
    <div className={`tourism-search-container ${className} ${isFocused ? 'focused' : ''}`}>
      <input
        type="text"
        placeholder={`Rechercher par nom de ${entityType || 'entité'}`}
        value={query}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="tourism-search-input"
      />
      <FaSearch className="tourism-search-icon" onClick={handleSearch} />
    </div>
  );
};

export default Search;