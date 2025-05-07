// import {
//   FETCH_FILTERED_ENTITIES_REQUEST,
//   FETCH_FILTERED_ENTITIES_SUCCESS,
//   FETCH_FILTERED_ENTITIES_FAILURE,
//   FETCH_SUGGESTED_PLACES_REQUEST,
//   FETCH_SUGGESTED_PLACES_SUCCESS,
//   FETCH_SUGGESTED_PLACES_FAILURE,
//   SAVE_CIRCUIT_REQUEST,
//   SAVE_CIRCUIT_SUCCESS,
//   SAVE_CIRCUIT_FAILURE
// } from '../constants/circuitConstants';

// const initialState = {
//   entities: {},
//   suggestions: {},
//   loading: false,
//   error: null,
//   circuitId: null
// };

// const circuitReducer = (state = initialState, action) => {
//   switch (action.type) {
//     case FETCH_FILTERED_ENTITIES_REQUEST:
//     case FETCH_SUGGESTED_PLACES_REQUEST:
//     case SAVE_CIRCUIT_REQUEST:
//       return { ...state, loading: true, error: null };
//     case FETCH_FILTERED_ENTITIES_SUCCESS:
//       return { ...state, entities: action.payload, loading: false };
//     case FETCH_SUGGESTED_PLACES_SUCCESS:
//       return { ...state, suggestions: action.payload, loading: false };
//     case SAVE_CIRCUIT_SUCCESS:
//       return { ...state, circuitId: action.payload, loading: false };
//     case FETCH_FILTERED_ENTITIES_FAILURE:
//     case FETCH_SUGGESTED_PLACES_FAILURE:
//     case SAVE_CIRCUIT_FAILURE:
//       return { ...state, error: action.payload, loading: false };
//     default:
//       return state;
//   }
// };

// export default circuitReducer;



import {
  COMPOSE_CIRCUIT_REQUEST,
  COMPOSE_CIRCUIT_SUCCESS,
  COMPOSE_CIRCUIT_FAIL,
  FETCH_CIRCUITS_REQUEST,
  FETCH_CIRCUITS_SUCCESS,
  FETCH_CIRCUITS_FAIL,
  FETCH_CIRCUIT_DETAILS_REQUEST,
  FETCH_CIRCUIT_DETAILS_SUCCESS,
  FETCH_CIRCUIT_DETAILS_FAIL,
  DELETE_CIRCUIT_REQUEST,
  DELETE_CIRCUIT_SUCCESS,
  DELETE_CIRCUIT_FAIL,
  ADMIN_CREATE_CIRCUIT_REQUEST,
  ADMIN_CREATE_CIRCUIT_SUCCESS,
  ADMIN_CREATE_CIRCUIT_FAIL,
} from '../actions/circuitActions';

const initialState = {
  circuit: null,
  circuits: [], // Add circuits array for list
  loading: false,
  error: null,
  deleteLoading: false,
  deleteError: null,
  createLoading: false,
  createError: null,
  adminCreateLoading: false,
  adminCreateError: null,
};

const circuitReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CIRCUITS_REQUEST:
    case FETCH_CIRCUIT_DETAILS_REQUEST:
    case COMPOSE_CIRCUIT_REQUEST:
      return { ...state, loading: true, error: null };

      case FETCH_CIRCUITS_SUCCESS:
        return {
          ...state,
          loading: false,
          circuits: action.payload,
          error: null,
        };
  
      case FETCH_CIRCUIT_DETAILS_SUCCESS:
        return {
          ...state,
          loading: false,
          circuit: action.payload,
          error: null,
        };
    case COMPOSE_CIRCUIT_SUCCESS:
      return {
        ...state,
        loading: false,
        circuit: {
          id: action.payload.circuitId,
          orderedDestinations: action.payload.orderedDestinations,
        },
        error: null,
      };
    case COMPOSE_CIRCUIT_FAIL:
      return { ...state, loading: false, error: action.payload };

      case DELETE_CIRCUIT_REQUEST:
        return { ...state, deleteLoading: true, deleteError: null };
  
      case DELETE_CIRCUIT_SUCCESS:
        return {
          ...state,
          deleteLoading: false,
          deleteError: null,
          circuits: state.circuits.filter(circuit => circuit.id !== action.payload),
          circuit: state.circuit && state.circuit.id === action.payload ? null : state.circuit,
        };
  
      case DELETE_CIRCUIT_FAIL:
        return { ...state, deleteLoading: false, deleteError: action.payload };
  
      case ADMIN_CREATE_CIRCUIT_REQUEST:
        return { ...state, adminCreateLoading: true, adminCreateError: null };
  
      case ADMIN_CREATE_CIRCUIT_SUCCESS:
        return {
          ...state,
          adminCreateLoading: false,
          adminCreateError: null,
          circuit: {
            id: action.payload.circuitId,
            orderedDestinations: action.payload.orderedDestinations,
          },
        };
  
      case ADMIN_CREATE_CIRCUIT_FAIL:
        return { ...state, adminCreateLoading: false, adminCreateError: action.payload };
    default:
      return state;
  }
};

export default circuitReducer;