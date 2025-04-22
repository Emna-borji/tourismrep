// src/actions/destinationActions.js
import axios from '../../api/api';
import { FETCH_DESTINATIONS_FAIL, FETCH_DESTINATIONS_REQUEST, FETCH_DESTINATIONS_SUCCESS } from '../constants/destinationConstants';

export const fetchDestinations = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DESTINATIONS_REQUEST });

    const response = await axios.get('/api/tourism/destinations/'); // Use relative URL since the base URL is configured in ../api/api

    dispatch({
      type: FETCH_DESTINATIONS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_DESTINATIONS_FAIL,
      payload: error.response?.data?.error || error.message,
    });
  }
};