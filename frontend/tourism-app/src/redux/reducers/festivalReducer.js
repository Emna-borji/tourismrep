import {
    FETCH_FESTIVALS_LOADING,
    FETCH_FESTIVALS_SUCCESS,
    FETCH_FESTIVALS_ERROR,
  } from '../constants/festivalConstants';
  
  const initialState = {
    festivals: [],
    loading: false,
    error: null,
  };
  
  const festivalReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_FESTIVALS_LOADING:
        return { ...state, loading: true };
      case FETCH_FESTIVALS_SUCCESS:
        return { ...state, loading: false, festivals: action.payload };
      case FETCH_FESTIVALS_ERROR:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default festivalReducer;
  