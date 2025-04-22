import axios from 'axios';
import {
  FETCH_MUSEUMS_LOADING,
  FETCH_MUSEUMS_SUCCESS,
  FETCH_MUSEUMS_ERROR
} from '../constants/museumConstants';

export const fetchMuseums = () => async (dispatch) => {
  dispatch({ type: FETCH_MUSEUMS_LOADING });

  try {
    const response = await axios.get('http://127.0.0.1:8000/api/tourism/museums/'); // Replace with your API endpoint
    dispatch({
      type: FETCH_MUSEUMS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_MUSEUMS_ERROR,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};
