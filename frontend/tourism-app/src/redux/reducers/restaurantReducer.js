import { FETCH_RESTAURANTS_FAILURE, FETCH_RESTAURANTS_REQUEST, FETCH_RESTAURANTS_SUCCESS, SORT_RESTAURANTS } from "../constants/restaurantConstants";

const initialState = {
    loading: false,
    restaurants: [],
    error: null,
    sortOption: 'Prix croissant', 
  };
  
  export const restaurantReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_RESTAURANTS_REQUEST:
        return { ...state, loading: true };
      case FETCH_RESTAURANTS_SUCCESS:
        return { ...state, loading: false, restaurants: action.payload };
      case FETCH_RESTAURANTS_FAILURE:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };