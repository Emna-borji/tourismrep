import {
  FETCH_ENTITIES_REQUEST,
  FETCH_ENTITIES_SUCCESS,
  FETCH_ENTITIES_FAIL,
  FETCH_ENTITY_REQUEST,
  FETCH_ENTITY_SUCCESS,
  FETCH_ENTITY_FAIL,
  UPDATE_ENTITY_REQUEST,
  UPDATE_ENTITY_SUCCESS,
  UPDATE_ENTITY_FAIL,
  DELETE_ENTITY_REQUEST,
  DELETE_ENTITY_SUCCESS,
  DELETE_ENTITY_FAIL,
  FETCH_CUISINES_REQUEST,
  FETCH_CUISINES_SUCCESS,
  FETCH_CUISINES_FAIL,
  UPDATE_CUISINE_REQUEST,
  UPDATE_CUISINE_SUCCESS,
  UPDATE_CUISINE_FAIL,
  DELETE_CUISINE_REQUEST,
  DELETE_CUISINE_SUCCESS,
  DELETE_CUISINE_FAIL,
  CREATE_CUISINE_REQUEST,
  CREATE_CUISINE_SUCCESS,
  CREATE_CUISINE_FAIL,
  CLEAR_ENTITIES,
  CLEAR_CIRCUIT_ENTITIES,
  CREATE_ENTITY_REQUEST, // New action type
  CREATE_ENTITY_SUCCESS, // New action type
  CREATE_ENTITY_FAIL,   // New action type
} from '../constants/entityConstants';


const initialState = {
  entities: [],
  entity: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
  deleteLoading: false,
  deleteError: null,
  cuisines: [],
  cuisinesLoading: false,
  cuisinesError: null,
  updateCuisineLoading: false,
  updateCuisineError: null,
  deleteCuisineLoading: false,
  deleteCuisineError: null,
  createCuisineLoading: false,
  createCuisineError: null,
  circuitEntities: [],
  createEntityLoading: false, // New state for create entity loading
  createEntityError: null,   // New state for create entity error
};

export const entityReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ENTITIES_REQUEST:
    case FETCH_ENTITY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_ENTITIES_SUCCESS:
      return {
        ...state,
        entities: action.payload.data,
        circuitEntities: [
          ...state.circuitEntities,
          {
            entityType: action.payload.entityType,
            destinationId: action.payload.destinationId,
            day: action.payload.day,
            data: action.payload.data,
          },
        ],
        loading: false,
        error: null,
      };
    case FETCH_ENTITY_SUCCESS:
      return {
        ...state,
        entity: action.payload.data,
        loading: false,
        error: null,
      };
    case FETCH_ENTITIES_FAIL:
    case FETCH_ENTITY_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CLEAR_ENTITIES:
      return {
        ...state,
        entities: [],
      };
    case CLEAR_CIRCUIT_ENTITIES:
      return {
        ...state,
        circuitEntities: [],
      };
    case UPDATE_ENTITY_REQUEST:
      return {
        ...state,
        updateLoading: true,
        updateError: null,
      };
    case UPDATE_ENTITY_SUCCESS:
      return {
        ...state,
        updateLoading: false,
        entity: action.payload.data,
        updateError: null,
      };
    case UPDATE_ENTITY_FAIL:
      return {
        ...state,
        updateLoading: false,
        updateError: action.payload,
      };
    case DELETE_ENTITY_REQUEST:
      return {
        ...state,
        deleteLoading: true,
        deleteError: null,
      };
    case DELETE_ENTITY_SUCCESS:
      return {
        ...state,
        deleteLoading: false,
        entity: null,
        deleteError: null,
      };
    case DELETE_ENTITY_FAIL:
      return {
        ...state,
        deleteLoading: false,
        deleteError: action.payload,
      };
    case FETCH_CUISINES_REQUEST:
      return { ...state, cuisinesLoading: true, cuisinesError: null };
    case FETCH_CUISINES_SUCCESS:
      return { ...state, cuisinesLoading: false, cuisines: action.payload };
    case FETCH_CUISINES_FAIL:
      return { ...state, cuisinesLoading: false, cuisinesError: action.payload };
    case UPDATE_CUISINE_REQUEST:
      return { ...state, updateCuisineLoading: true, updateCuisineError: null };
    case UPDATE_CUISINE_SUCCESS:
      return { ...state, updateCuisineLoading: false, updateCuisineError: null };
    case UPDATE_CUISINE_FAIL:
      return { ...state, updateCuisineLoading: false, updateCuisineError: action.payload };
    case DELETE_CUISINE_REQUEST:
      return { ...state, deleteCuisineLoading: true, deleteCuisineError: null };
    case DELETE_CUISINE_SUCCESS:
      return { ...state, deleteCuisineLoading: false, deleteCuisineError: null };
    case DELETE_CUISINE_FAIL:
      return { ...state, deleteCuisineLoading: false, deleteCuisineError: action.payload };
    case CREATE_CUISINE_REQUEST:
      return { ...state, createCuisineLoading: true, createCuisineError: null };
    case CREATE_CUISINE_SUCCESS:
      return { ...state, createCuisineLoading: false, createCuisineError: null };
    case CREATE_CUISINE_FAIL:
      return { ...state, createCuisineLoading: false, createCuisineError: action.payload };
    case CREATE_ENTITY_REQUEST:
      return { ...state, createEntityLoading: true, createEntityError: null };
    case CREATE_ENTITY_SUCCESS:
      return { ...state, createEntityLoading: false, createEntityError: null };
    case CREATE_ENTITY_FAIL:
      return { ...state, createEntityLoading: false, createEntityError: action.payload };
    default:
      return state;
  }
};