import axios from '../../api/api';

import {
    FETCH_CIRCUIT_HISTORY_REQUEST,
    FETCH_CIRCUIT_HISTORY_SUCCESS,
    FETCH_CIRCUIT_HISTORY_FAIL,
    SAVE_CIRCUIT_HISTORY_REQUEST,
    SAVE_CIRCUIT_HISTORY_SUCCESS,
    SAVE_CIRCUIT_HISTORY_FAIL,
    CHECK_CIRCUIT_HISTORY_DUPLICATE_SUCCESS,
    CHECK_CIRCUIT_HISTORY_DUPLICATE_FAIL,
    CHECK_CIRCUIT_HISTORY_DUPLICATE_REQUEST,
  } from '../constants/circuitHistoryConstants';

export const fetchCircuitHistory = () => async (dispatch, getState) => {
  try {
    dispatch({ type: FETCH_CIRCUIT_HISTORY_REQUEST });

    const { auth: { userInfo } } = getState();
    const token = userInfo?.token || localStorage.getItem('token');
    console.log(token)
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const { data } = await axios.get('/api/itinerary/circuit_history/', config);
    console.log(data)
    dispatch({
      type: FETCH_CIRCUIT_HISTORY_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_CIRCUIT_HISTORY_FAIL,
      payload: error.response?.data?.message || error.message || 'Failed to fetch circuit history',
    });
  }
};




export const saveCircuitToHistory = (circuitData) => async (dispatch, getState) => {
  try {
    dispatch({ type: SAVE_CIRCUIT_HISTORY_REQUEST });

    const { auth: { userInfo } } = getState();
    const token = userInfo?.token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const { data } = await axios.post('/api/itinerary/circuit_history/', circuitData, config);
    dispatch({
      type: SAVE_CIRCUIT_HISTORY_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save circuit to history';
    dispatch({
      type: SAVE_CIRCUIT_HISTORY_FAIL,
      payload: errorMsg,
    });
    throw new Error(errorMsg);
  }
};


export const checkCircuitHistoryDuplicate = (circuitHistoryData) => async (dispatch, getState) => {
  try {
    dispatch({ type: CHECK_CIRCUIT_HISTORY_DUPLICATE_REQUEST });

    const { userInfo } = getState().auth;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    console.log('Checking circuit history duplicate with data:', circuitHistoryData);

    // Updated URL to match Django's endpoint: circuit_history instead of circuit-history
    const { data } = await axios.post(
      `/api/itinerary/circuit_history/check_history_duplicate/`,
      circuitHistoryData,
      config
    );

    console.log('Check circuit history response:', data);

    dispatch({
      type: CHECK_CIRCUIT_HISTORY_DUPLICATE_SUCCESS,
      payload: data,
    });

    return data; // { exists: true/false, circuitHistoryId: id }
  } catch (error) {
    console.error('Error checking circuit history duplicate:', error.response || error);
    dispatch({
      type: CHECK_CIRCUIT_HISTORY_DUPLICATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
    throw error;
  }
};

