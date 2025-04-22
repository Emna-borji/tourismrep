// import { FETCH_DESTINATIONS_FAIL, FETCH_DESTINATIONS_REQUEST, FETCH_DESTINATIONS_SUCCESS } from "../constants/destinationConstants";

// const initialState = {
//     loading: false,
//     destinations: [],
//     error: '',
//   };
  
//   export const destinationReducer = (state = initialState, action) => {
//     switch (action.type) {
//       case FETCH_DESTINATIONS_REQUEST:
//         return { ...state, loading: true };
  
//       case FETCH_DESTINATIONS_SUCCESS:
//         return { ...state, loading: false, destinations: action.payload };
  
//       case FETCH_DESTINATIONS_FAIL:
//         return { ...state, loading: false, error: action.payload };
  
//       default:
//         return state;
//     }
//   };


// src/reducers/destinationReducer.js
import { FETCH_DESTINATIONS_FAIL, FETCH_DESTINATIONS_REQUEST, FETCH_DESTINATIONS_SUCCESS } from "../constants/destinationConstants";

const initialState = {
  loading: false,
  destinations: [],
  error: '',
};

export const destinationReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DESTINATIONS_REQUEST:
      return { ...state, loading: true, error: '' }; // Reset error on request

    case FETCH_DESTINATIONS_SUCCESS:
      return { ...state, loading: false, destinations: action.payload };

    case FETCH_DESTINATIONS_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};