// src/redux/actions/searchActions.js
import axios from 'axios';
import { SAVE_SEARCH_FAIL, SAVE_SEARCH_REQUEST, SAVE_SEARCH_SUCCESS, TRACK_CLICK_FAIL, TRACK_CLICK_REQUEST, TRACK_CLICK_SUCCESS } from '../constants/searchConstants';


// Save Search Action
export const saveSearch = (query, entityType) => async (dispatch, getState) => {
  try {
    console.log(query);
    console.log(entityType)
    dispatch({ type: SAVE_SEARCH_REQUEST });

    const {
      auth: { userInfo },
    } = getState();

    if (!userInfo) {
      throw new Error('User not authenticated');
    }

    const token = localStorage.getItem('access_token'); // Adjust based on where you store the token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const { data } = await axios.post(
      'http://localhost:8000/api/save-search/',
      { q: query, entity_type: entityType },
      config
    );

    dispatch({
      type: SAVE_SEARCH_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SAVE_SEARCH_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Track Click Action
export const trackClick = (entityType, entityId) => async (dispatch, getState) => {
  try {
    
    console.log(entityId,"hii");
    console.log(entityType)
    dispatch({ type: TRACK_CLICK_REQUEST });

    const {
      auth: { userInfo },
    } = getState();

    if (!userInfo) {
      throw new Error('User not authenticated');
    }

    const token = localStorage.getItem('access_token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    console.log(entityId.id)
    console.log(entityId.id)
    console.log(entityId)
    const { data } = await axios.post(
      'http://localhost:8000/api/track-click/',
      { entity_type: entityType, entity_id: entityId },
      config
    );

    dispatch({
      type: TRACK_CLICK_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TRACK_CLICK_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};