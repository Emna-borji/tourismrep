// import axios from 'axios';
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

// export const fetchFilteredEntities = (preferences) => async (dispatch) => {
//   dispatch({ type: FETCH_FILTERED_ENTITIES_REQUEST });
//   try {
//     const response = await axios.post('/api/itinerary/filtered-entities/', preferences, {
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//     });
//     dispatch({ type: FETCH_FILTERED_ENTITIES_SUCCESS, payload: response.data.entities || {} });
//   } catch (error) {
//     const errorMessage = error.response?.data?.message || error.message;
//     console.error('fetchFilteredEntities error:', errorMessage);
//     dispatch({ type: FETCH_FILTERED_ENTITIES_FAILURE, payload: errorMessage });
//   }
// };

// export const fetchSuggestedPlaces = (data) => async (dispatch) => {
//   dispatch({ type: FETCH_SUGGESTED_PLACES_REQUEST });
//   try {
//     const response = await axios.post('/api/itinerary/suggested-places/', data, {
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//     });
//     console.log('fetchSuggestedPlaces response:', response.data); // Debug
//     dispatch({ type: FETCH_SUGGESTED_PLACES_SUCCESS, payload: response.data.suggestions || {} });
//   } catch (error) {
//     const errorMessage = error.response?.data?.message || error.message;
//     console.error('fetchSuggestedPlaces error:', errorMessage);
//     dispatch({ type: FETCH_SUGGESTED_PLACES_FAILURE, payload: errorMessage });
//   }
// };

// export const saveCircuit = (circuitData) => async (dispatch) => {
//   dispatch({ type: SAVE_CIRCUIT_REQUEST });
//   try {
//     const response = await axios.post('/api/itinerary/compose/', circuitData, {
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//     });
//     dispatch({ type: SAVE_CIRCUIT_SUCCESS, payload: response.data.circuit_id });
//   } catch (error) {
//     const errorMessage = error.response?.data?.message || error.message;
//     dispatch({ type: SAVE_CIRCUIT_FAILURE, payload: errorMessage });
//   }
// };




import api from '../../api/api';

// Action Types
export const COMPOSE_CIRCUIT_REQUEST = 'COMPOSE_CIRCUIT_REQUEST';
export const COMPOSE_CIRCUIT_SUCCESS = 'COMPOSE_CIRCUIT_SUCCESS';
export const COMPOSE_CIRCUIT_FAIL = 'COMPOSE_CIRCUIT_FAIL';
export const FETCH_CIRCUITS_REQUEST = 'FETCH_CIRCUITS_REQUEST';
export const FETCH_CIRCUITS_SUCCESS = 'FETCH_CIRCUITS_SUCCESS';
export const FETCH_CIRCUITS_FAIL = 'FETCH_CIRCUITS_FAIL';

export const FETCH_CIRCUIT_DETAILS_REQUEST = 'FETCH_CIRCUIT_DETAILS_REQUEST';
export const FETCH_CIRCUIT_DETAILS_SUCCESS = 'FETCH_CIRCUIT_DETAILS_SUCCESS';
export const FETCH_CIRCUIT_DETAILS_FAIL = 'FETCH_CIRCUIT_DETAILS_FAIL';

export const DELETE_CIRCUIT_REQUEST = 'DELETE_CIRCUIT_REQUEST';
export const DELETE_CIRCUIT_SUCCESS = 'DELETE_CIRCUIT_SUCCESS';
export const DELETE_CIRCUIT_FAIL = 'DELETE_CIRCUIT_FAIL';

export const ADMIN_CREATE_CIRCUIT_REQUEST = 'ADMIN_CREATE_CIRCUIT_REQUEST';
export const ADMIN_CREATE_CIRCUIT_SUCCESS = 'ADMIN_CREATE_CIRCUIT_SUCCESS';
export const ADMIN_CREATE_CIRCUIT_FAIL = 'ADMIN_CREATE_CIRCUIT_FAIL';


// Thunk Action to Fetch List of Circuits
// export const fetchCircuits = () => async (dispatch, getState) => {
//   try {
//     dispatch({ type: FETCH_CIRCUITS_REQUEST });

//     const { auth } = getState();
//     let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
//     if (!token) {
//       const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
//       if (!localToken) {
//         throw new Error('Authentication token is missing. Please log in again.');
//       }
//       token = localToken;
//     }

//     const config = {
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     };

//     const response = await api.get('/api/itinerary/circuits/', config);
//     dispatch({
//       type: FETCH_CIRCUITS_SUCCESS,
//       payload: response.data,
//     });
//   } catch (error) {
//     const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to fetch circuits';
//     dispatch({
//       type: FETCH_CIRCUITS_FAIL,
//       payload: errorMsg,
//     });
//     throw new Error(errorMsg);
//   }
// };

export const fetchCircuits = (searchQuery = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: FETCH_CIRCUITS_REQUEST });

    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    if (!token) {
      const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!localToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      token = localToken;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    // Construct the URL with the search query if provided
    const url = searchQuery ? `/api/itinerary/circuits/?search=${encodeURIComponent(searchQuery)}` : '/api/itinerary/circuits/';
    const response = await api.get(url, config);

    dispatch({
      type: FETCH_CIRCUITS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to fetch circuits';
    dispatch({
      type: FETCH_CIRCUITS_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};




// Thunk Action to Fetch Circuit Details
export const fetchCircuitDetails = (circuitId) => async (dispatch, getState) => {
  try {
    dispatch({ type: FETCH_CIRCUIT_DETAILS_REQUEST });

    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    if (!token) {
      const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!localToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      token = localToken;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await api.get(`/api/itinerary/circuits/${circuitId}/`, config);
    dispatch({
      type: FETCH_CIRCUIT_DETAILS_SUCCESS,
      payload: response.data,
    });
    console.log(response.data)
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to fetch circuit details';
    dispatch({
      type: FETCH_CIRCUIT_DETAILS_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};




// Thunk Action to Compose Circuit
export const composeCircuit = (circuitData) => async (dispatch, getState) => {
  try {
    dispatch({ type: COMPOSE_CIRCUIT_REQUEST });

    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    if (!token) {
      const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!localToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      token = localToken;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    console.log("jjjjjjjjjj")
    console.log(circuitData)
    const response = await api.post('/api/itinerary/circuits/', circuitData, config);
    
    dispatch({
      type: COMPOSE_CIRCUIT_SUCCESS,
      payload: {
        circuitId: response.data.circuit_id,
        orderedDestinations: response.data.ordered_destinations,
      },
    });
    
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to compose circuit';
    dispatch({
      type: COMPOSE_CIRCUIT_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};


// Thunk Action to Delete Circuit
export const deleteCircuit = (circuitId) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELETE_CIRCUIT_REQUEST });

    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    if (!token) {
      const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!localToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      token = localToken;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await api.delete(`/api/itinerary/circuits/${circuitId}/`, config);
    dispatch({
      type: DELETE_CIRCUIT_SUCCESS,
      payload: circuitId,
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to delete circuit';
    dispatch({
      type: DELETE_CIRCUIT_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};



// Thunk Action for Admin to Manually Create Circuit
export const adminCreateCircuit = (circuitData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_CREATE_CIRCUIT_REQUEST });

    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    if (!token) {
      const localToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!localToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      token = localToken;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await api.post('/api/itinerary/admin/circuits/', circuitData, config);
    dispatch({
      type: ADMIN_CREATE_CIRCUIT_SUCCESS,
      payload: {
        circuitId: response.data.circuit_id,
        orderedDestinations: response.data.ordered_destinations,
      },
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create circuit';
    dispatch({
      type: ADMIN_CREATE_CIRCUIT_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};



export const checkExistingCircuit = (checkData) => async (dispatch, getState) => {
  console.log("checkDate")
  console.log(checkData)
  try {
    const { auth } = getState();
    let token = auth.userInfo?.token || auth.userInfo?.accessToken || auth.userInfo?.access_token || auth.userInfo?.jwt || auth.token;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    
    const { data } = await api.post('/api/itinerary/check/', checkData, config);
    
    return { exists: data.exists, circuitId: data.exists ? data.circuitId : null };
  } catch (error) {
    dispatch({
      type: 'CIRCUIT_FAIL',
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
    return { exists: false, error: 'Failed to check for existing itinerary.' };
  }
};