// guestHouseReducer.js
import {
    FETCH_GUEST_HOUSES_LOADING,
    FETCH_GUEST_HOUSES_SUCCESS,
    FETCH_GUEST_HOUSES_ERROR,
  } from '../constants/guestHouseConstants';
  
  const initialState = {
    guestHouses: [],
    loading: false,
    error: null,
  };
  
  const guestHouseReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_GUEST_HOUSES_LOADING:
        return { ...state, loading: true };
      case FETCH_GUEST_HOUSES_SUCCESS:
        return { ...state, loading: false, guestHouses: action.payload };
      case FETCH_GUEST_HOUSES_ERROR:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default guestHouseReducer;
  