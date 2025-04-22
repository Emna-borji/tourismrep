import {
    FETCH_MUSEUMS_LOADING,
    FETCH_MUSEUMS_SUCCESS,
    FETCH_MUSEUMS_ERROR
  } from '../constants/museumConstants';
  
  const initialState = {
    museums: [],
    loading: false,
    error: null,
  };
  
  const museumReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_MUSEUMS_LOADING:
        return { ...state, loading: true };
      case FETCH_MUSEUMS_SUCCESS:
        return { ...state, loading: false, museums: action.payload };
      case FETCH_MUSEUMS_ERROR:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default museumReducer;
  