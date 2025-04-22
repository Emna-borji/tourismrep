// actions/hotelActions.js
import axios from 'axios';

export const fetchHotels = () => async (dispatch) => {
  dispatch({ type: 'FETCH_HOTELS_REQUEST' });
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/tourism/hotels/'); // Change URL if necessary
    dispatch({ type: 'FETCH_HOTELS_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'FETCH_HOTELS_FAILURE',
      payload: error.message,
    });
  }
};
