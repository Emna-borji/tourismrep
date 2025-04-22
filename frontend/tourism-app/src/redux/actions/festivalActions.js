import axios from 'axios';
import {
  FETCH_FESTIVALS_LOADING,
  FETCH_FESTIVALS_SUCCESS,
  FETCH_FESTIVALS_ERROR,
} from '../constants/festivalConstants';

export const fetchFestivals = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_FESTIVALS_LOADING });
    const response = await axios.get('http://127.0.0.1:8000/api/tourism/festivals/');
    dispatch({
      type: FETCH_FESTIVALS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_FESTIVALS_ERROR,
      payload: error.message,
    });
  }
};
