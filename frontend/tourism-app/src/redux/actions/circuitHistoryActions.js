import axios from '../../api/api';

import {
    FETCH_CIRCUIT_HISTORY_REQUEST,
    FETCH_CIRCUIT_HISTORY_SUCCESS,
    FETCH_CIRCUIT_HISTORY_FAIL,
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