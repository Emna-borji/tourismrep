import axios from 'axios';
import {
  FETCH_FILTERED_ENTITIES_REQUEST,
  FETCH_FILTERED_ENTITIES_SUCCESS,
  FETCH_FILTERED_ENTITIES_FAILURE,
  FETCH_SUGGESTED_PLACES_REQUEST,
  FETCH_SUGGESTED_PLACES_SUCCESS,
  FETCH_SUGGESTED_PLACES_FAILURE,
  SAVE_CIRCUIT_REQUEST,
  SAVE_CIRCUIT_SUCCESS,
  SAVE_CIRCUIT_FAILURE
} from '../constants/circuitConstants';

export const fetchFilteredEntities = (preferences) => async (dispatch) => {
  dispatch({ type: FETCH_FILTERED_ENTITIES_REQUEST });
  try {
    const response = await axios.post('/api/itinerary/filtered-entities/', preferences, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    dispatch({ type: FETCH_FILTERED_ENTITIES_SUCCESS, payload: response.data.entities || {} });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('fetchFilteredEntities error:', errorMessage);
    dispatch({ type: FETCH_FILTERED_ENTITIES_FAILURE, payload: errorMessage });
  }
};

export const fetchSuggestedPlaces = (data) => async (dispatch) => {
  dispatch({ type: FETCH_SUGGESTED_PLACES_REQUEST });
  try {
    const response = await axios.post('/api/itinerary/suggested-places/', data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    console.log('fetchSuggestedPlaces response:', response.data); // Debug
    dispatch({ type: FETCH_SUGGESTED_PLACES_SUCCESS, payload: response.data.suggestions || {} });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('fetchSuggestedPlaces error:', errorMessage);
    dispatch({ type: FETCH_SUGGESTED_PLACES_FAILURE, payload: errorMessage });
  }
};

export const saveCircuit = (circuitData) => async (dispatch) => {
  dispatch({ type: SAVE_CIRCUIT_REQUEST });
  try {
    const response = await axios.post('/api/itinerary/compose/', circuitData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    dispatch({ type: SAVE_CIRCUIT_SUCCESS, payload: response.data.circuit_id });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: SAVE_CIRCUIT_FAILURE, payload: errorMessage });
  }
};