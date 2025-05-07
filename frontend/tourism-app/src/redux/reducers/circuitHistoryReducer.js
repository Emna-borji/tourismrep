import {
    FETCH_CIRCUIT_HISTORY_REQUEST,
    FETCH_CIRCUIT_HISTORY_SUCCESS,
    FETCH_CIRCUIT_HISTORY_FAIL,
  } from '../constants/circuitHistoryConstants';
  
  const initialState = {
    circuitHistory: [],
    loading: false,
    error: null,
  };
  
  const circuitHistoryReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_CIRCUIT_HISTORY_REQUEST:
        return { ...state, loading: true, error: null };
      case FETCH_CIRCUIT_HISTORY_SUCCESS:
        return { ...state, loading: false, circuitHistory: action.payload };
      case FETCH_CIRCUIT_HISTORY_FAIL:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export default circuitHistoryReducer;