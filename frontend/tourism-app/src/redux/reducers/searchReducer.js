// src/redux/reducers/searchReducers.js
import {
    SAVE_SEARCH_REQUEST,
    SAVE_SEARCH_SUCCESS,
    SAVE_SEARCH_FAIL,
    TRACK_CLICK_REQUEST,
    TRACK_CLICK_SUCCESS,
    TRACK_CLICK_FAIL,
  } from '../constants/searchConstants';
  
  export const saveSearchReducer = (state = { loading: false, success: false, error: null }, action) => {
    switch (action.type) {
      case SAVE_SEARCH_REQUEST:
        return { loading: true, success: false, error: null };
      case SAVE_SEARCH_SUCCESS:
        return { loading: false, success: true, data: action.payload, error: null };
      case SAVE_SEARCH_FAIL:
        return { loading: false, success: false, error: action.payload };
      default:
        return state;
    }
  };
  
  export const trackClickReducer = (state = { loading: false, success: false, error: null }, action) => {
    switch (action.type) {
      case TRACK_CLICK_REQUEST:
        return { loading: true, success: false, error: null };
      case TRACK_CLICK_SUCCESS:
        return { loading: false, success: true, data: action.payload, error: null };
      case TRACK_CLICK_FAIL:
        return { loading: false, success: false, error: action.payload };
      default:
        return state;
    }
  };