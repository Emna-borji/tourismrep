import axios from '../../api/api'; // Adjust based on your axios setup
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

export const fetchEntities = (
  entityType,
  { searchQuery = '', sortOption = '', destination_id = '', forks = '', stars = '', cuisine = '', category = '' } = {}
) => async (dispatch) => {
  if (entityType === 'destination') {
    return;
  }

  dispatch({ type: FETCH_ENTITIES_REQUEST });
  try {
    const entityTypePlural = entityType === 'activity' ? 'activities' : `${entityType}s`;
    let url = `/api/tourism/${entityTypePlural}/`;
    const params = new URLSearchParams();

    if (searchQuery) params.append('search', searchQuery);
    if (sortOption && sortOption !== 'Choisissez le tri') {
      params.append('sort_by', 'price');
      params.append('sort_direction', sortOption === 'Prix croissant' ? 'asc' : 'desc');
    }
    if (destination_id) {
      params.append('destination_id', destination_id);
    }
    if (category) params.append('category', category);
    if (forks) params.append('forks', forks);
    if (stars) params.append('stars', stars);
    if (cuisine) params.append('cuisine', cuisine);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    console.log(`Fetching ${entityType} with URL:`, url);
    const response = await axios.get(url);
    const data = response.data || [];
    console.log(`Response for ${entityType}:`, data);
    dispatch({ type: FETCH_ENTITIES_SUCCESS, payload: { entityType, data } });
    return data;
  } catch (error) {
    console.error(`Error fetching ${entityType}:`, error);
    const errorMessage = error.response?.data?.error || `Failed to fetch ${entityType}s`;
    dispatch({
      type: FETCH_ENTITIES_FAIL,
      payload: errorMessage,
    });
    throw new Error(errorMessage);
  }
};

export const clearEntities = () => (dispatch) => {
  console.log('Clearing circuitEntities at:', new Date().toISOString());
  dispatch({ type: CLEAR_ENTITIES });
  dispatch({ type: CLEAR_CIRCUIT_ENTITIES });
};

export const fetchEntityById = (entityType, id) => async (dispatch) => {
  dispatch({ type: FETCH_ENTITY_REQUEST });
  try {
    const pluralEntityType = entityType === 'activity' ? 'activities' : `${entityType}s`;
    const response = await axios.get(`/api/tourism/${pluralEntityType}/${id}/`);
    dispatch({ type: FETCH_ENTITY_SUCCESS, payload: { entityType, data: response.data } });
  } catch (error) {
    dispatch({
      type: FETCH_ENTITY_FAIL,
      payload: error.response?.data?.error || `Failed to fetch ${entityType}`,
    });
  }
};

export const updateEntity = (entityType, id, updatedData) => async (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTITY_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.put(`/api/tourism/${entityType}s/${id}/`, updatedData, config);
    dispatch({ type: UPDATE_ENTITY_SUCCESS, payload: { entityType, data: response.data } });
  } catch (error) {
    dispatch({
      type: UPDATE_ENTITY_FAIL,
      payload: error.response?.data?.error || `Failed to update ${entityType}`,
    });
  }
};

export const deleteEntity = (entityType, id) => async (dispatch, getState) => {
  dispatch({ type: DELETE_ENTITY_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    await axios.delete(`/api/tourism/${entityType}s/${id}/`, config);
    dispatch({ type: DELETE_ENTITY_SUCCESS, payload: { entityType, id } });
  } catch (error) {
    dispatch({
      type: DELETE_ENTITY_FAIL,
      payload: error.response?.data?.error || `Failed to delete ${entityType}`,
    });
  }
};

export const fetchCuisines = () => async (dispatch) => {
  dispatch({ type: FETCH_CUISINES_REQUEST });
  try {
    const response = await axios.get('/api/tourism/cuisines/');
    dispatch({ type: FETCH_CUISINES_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: FETCH_CUISINES_FAIL,
      payload: error.response?.data?.error || 'Failed to fetch cuisines',
    });
  };
};

export const updateCuisine = (id, name) => async (dispatch, getState) => {
  dispatch({ type: UPDATE_CUISINE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.put(`/api/tourism/cuisines/${id}/`, { name }, config);
    dispatch({ type: UPDATE_CUISINE_SUCCESS, payload: response.data });
    dispatch(fetchCuisines());
  } catch (error) {
    dispatch({
      type: UPDATE_CUISINE_FAIL,
      payload: error.response?.data?.error || 'Failed to update cuisine',
    });
  }
};

export const deleteCuisine = (id) => async (dispatch, getState) => {
  dispatch({ type: DELETE_CUISINE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    await axios.delete(`/api/tourism/cuisines/${id}/`, config);
    dispatch({ type: DELETE_CUISINE_SUCCESS, payload: id });
    dispatch(fetchCuisines());
  } catch (error) {
    dispatch({
      type: DELETE_CUISINE_FAIL,
      payload: error.response?.data?.error || 'Failed to delete cuisine',
    });
  }
};

export const createCuisine = (name) => async (dispatch, getState) => {
  dispatch({ type: CREATE_CUISINE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.post('/api/tourism/cuisines/', { name }, config);
    dispatch({ type: CREATE_CUISINE_SUCCESS, payload: response.data });
    dispatch(fetchCuisines());
  } catch (error) {
    dispatch({
      type: CREATE_CUISINE_FAIL,
      payload: error.response?.data?.error || 'Failed to create cuisine',
    });
  }
};

// New action to create an entity
export const createEntity = (entityType, entityData) => async (dispatch, getState) => {
  dispatch({ type: CREATE_ENTITY_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const entityTypePlural = entityType === 'activity' ? 'activities' : `${entityType}s`;
    const response = await axios.post(`/api/tourism/${entityTypePlural}/`, entityData, config);
    dispatch({ type: CREATE_ENTITY_SUCCESS, payload: { entityType, data: response.data } });
    // Refetch entities to update the list
    dispatch(fetchEntities(entityType));
  } catch (error) {
    dispatch({
      type: CREATE_ENTITY_FAIL,
      payload: error.response?.data?.error || `Failed to create ${entityType}`,
    });
  }
};