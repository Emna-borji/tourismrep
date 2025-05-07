import {
    FETCH_RECOMMENDATIONS_REQUEST,
    FETCH_RECOMMENDATIONS_SUCCESS,
    FETCH_RECOMMENDATIONS_FAILURE,
  } from '../constants/recommendationsConstants';
  
  const initialState = {
    recommendations: {
      circuit: [],
      hotel: [],
      guest_house: [],
      restaurant: [],
      activity: [],
      museum: [],
      festival: [],
      archaeological_site: [],
    },
    loading: false,
    error: null,
  };
  
  const recommendationsReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_RECOMMENDATIONS_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case FETCH_RECOMMENDATIONS_SUCCESS:
        return {
          ...state,
          recommendations: action.payload,
          loading: false,
          error: null,
        };
      case FETCH_RECOMMENDATIONS_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default recommendationsReducer;