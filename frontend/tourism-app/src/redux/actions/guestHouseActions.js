import axios from 'axios';
import {
  FETCH_GUEST_HOUSES_LOADING,
  FETCH_GUEST_HOUSES_SUCCESS,
  FETCH_GUEST_HOUSES_ERROR,
} from '../constants/guestHouseConstants';

export const fetchGuestHouses = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_GUEST_HOUSES_LOADING });
    const response = await axios.get('http://127.0.0.1:8000/api/tourism/guest_houses/');
    dispatch({
      type: FETCH_GUEST_HOUSES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_GUEST_HOUSES_ERROR,
      payload: error.message,
    });
  }
};
