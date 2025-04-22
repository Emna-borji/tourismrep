import axios from '../../api/api';
import {
  ADD_FAVORITE_FAILURE,
  ADD_FAVORITE_REQUEST,
  ADD_FAVORITE_SUCCESS,
  FETCH_FAVORITES_FAILURE,
  FETCH_FAVORITES_REQUEST,
  FETCH_FAVORITES_SUCCESS,
  REMOVE_FAVORITE_FAILURE,
  REMOVE_FAVORITE_REQUEST,
  REMOVE_FAVORITE_SUCCESS,
} from "../constants/favoriteConstants";

// Fetch a single entity by ID
export const fetchEntityById = (entityType, id) => async (dispatch) => {
  try {
    const url = `/api/tourism/${entityType}s/${id}/`;
    console.log('Fetching entity from:', url);
    const response = await axios.get(url);
    console.log(`Entity details for ${entityType}/${id}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch entity ${entityType}/${id}:`, error.response?.status, error.response?.data || error.message);
    throw error;
  }
};

// Add to favorites
export const addToFavorite = (entityType, entityId) => async (dispatch) => {
  dispatch({ type: ADD_FAVORITE_REQUEST });
  try {
    const response = await axios.post('/api/tourism/favorites/add_to_favorite/', {
      entity_type: entityType,
      entity_id: entityId,
    });
    dispatch({ type: ADD_FAVORITE_SUCCESS, payload: { entityType, entityId } });
    return response.data;
  } catch (error) {
    dispatch({ type: ADD_FAVORITE_FAILURE, payload: error.response?.data?.error || 'Failed to add to favorites' });
    throw error;
  }
};

// Remove from favorites
export const removeFromFavorite = (entityType, entityId) => async (dispatch) => {
  dispatch({ type: REMOVE_FAVORITE_REQUEST });
  try {
    const response = await axios.post('/api/tourism/favorites/remove_from_favorite/', {
      entity_type: entityType,
      entity_id: entityId,
    });
    dispatch({ type: REMOVE_FAVORITE_SUCCESS, payload: { entityType, entityId } });
    return response.data;
  } catch (error) {
    dispatch({ type: REMOVE_FAVORITE_FAILURE, payload: error.response?.data?.error || 'Failed to remove from favorites' });
    throw error;
  }
};

// Fetch user's favorites with entity details
export const fetchFavorites = () => async (dispatch, getState) => {
  dispatch({ type: FETCH_FAVORITES_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    console.log('Fetching favorites from:', '/api/tourism/favorites/');
    const response = await axios.get('/api/tourism/favorites/', config);
    console.log('Favorites response:', response.data);
    const favorites = response.data;

    const detailedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          console.log(`Fetching entity details for ${favorite.entity_type}/${favorite.entity_id}`);
          const entityDetails = await dispatch(fetchEntityById(favorite.entity_type, favorite.entity_id));
          console.log(`Successfully fetched entity details for ${favorite.entity_type}/${favorite.entity_id}:`, entityDetails);
          return { ...favorite, entityDetails };
        } catch (error) {
          console.error(`Failed to fetch details for ${favorite.entity_type}/${favorite.entity_id}:`, error);
          return { ...favorite, entityDetails: null };
        }
      })
    );

    console.log('Detailed favorites:', detailedFavorites);
    dispatch({ type: FETCH_FAVORITES_SUCCESS, payload: detailedFavorites });
  } catch (error) {
    console.error('Favorites fetch error:', error.response?.data || error.message);
    dispatch({
      type: FETCH_FAVORITES_FAILURE,
      payload: error.response?.data?.error || 'Failed to fetch favorites',
    });
  }
};