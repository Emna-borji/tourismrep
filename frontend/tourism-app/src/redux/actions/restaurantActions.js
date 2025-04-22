import axios from 'axios';
import { FETCH_RESTAURANTS_FAILURE, FETCH_RESTAURANTS_REQUEST, FETCH_RESTAURANTS_SUCCESS } from '../constants/restaurantConstants';

// Fetch Restaurants Action
export const fetchRestaurants = (params = {}) => async (dispatch) => {
  dispatch({ type: FETCH_RESTAURANTS_REQUEST });

  try {
    const { searchQuery = '', sortOption = 'Choisissez le tri', destination = '', forks = '' } = params;
    
    // Prepare query parameters
    let query = '';
    if (searchQuery) {
      query += `search=${encodeURIComponent(searchQuery)}&`;
    }
    if (sortOption && sortOption !== 'Choisissez le tri') { // Only include price if sortOption is not the default
      const sortOrder = sortOption === 'Prix croissant' ? 'asc' : 'desc';
      query += `price=${sortOrder}&`;
    }
    if (destination && destination !== 'Choisissez votre destination') { // Only include destination if not the default
      query += `destination=${encodeURIComponent(destination)}&`;
    }
    if (forks) {
      query += `forks=${forks}&`;
    }

    const response = await axios.get(`http://127.0.0.1:8000/api/tourism/restaurants/?${query}`);
    dispatch({ type: FETCH_RESTAURANTS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: FETCH_RESTAURANTS_FAILURE,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};