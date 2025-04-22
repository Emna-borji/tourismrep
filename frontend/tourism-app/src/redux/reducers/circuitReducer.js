import {
  FETCH_FILTERED_ENTITIES_REQUEST,
  FETCH_FILTERED_ENTITIES_SUCCESS,
  FETCH_FILTERED_ENTITIES_FAILURE,
  FETCH_SUGGESTED_PLACES_REQUEST,
  FETCH_SUGGESTED_PLACES_SUCCESS,
  FETCH_SUGGESTED_PLACES_FAILURE,
  SAVE_CIRCUIT_REQUEST,
  SAVE_CIRCUIT_SUCCESS,
  SAVE_CIRCUIT_FAILURE
} from '../constants/circuitConstants';

const initialState = {
  entities: {},
  suggestions: {},
  loading: false,
  error: null,
  circuitId: null
};

const circuitReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FILTERED_ENTITIES_REQUEST:
    case FETCH_SUGGESTED_PLACES_REQUEST:
    case SAVE_CIRCUIT_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_FILTERED_ENTITIES_SUCCESS:
      return { ...state, entities: action.payload, loading: false };
    case FETCH_SUGGESTED_PLACES_SUCCESS:
      return { ...state, suggestions: action.payload, loading: false };
    case SAVE_CIRCUIT_SUCCESS:
      return { ...state, circuitId: action.payload, loading: false };
    case FETCH_FILTERED_ENTITIES_FAILURE:
    case FETCH_SUGGESTED_PLACES_FAILURE:
    case SAVE_CIRCUIT_FAILURE:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export default circuitReducer;