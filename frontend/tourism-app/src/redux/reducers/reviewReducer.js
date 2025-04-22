// src/reducers/reviewReducer.js
import {
  FETCH_REVIEWS_REQUEST,
  FETCH_REVIEWS_SUCCESS,
  FETCH_REVIEWS_FAIL,
  CREATE_REVIEW_REQUEST,
  CREATE_REVIEW_SUCCESS,
  CREATE_REVIEW_FAIL,
  CLEAR_REVIEW_SUCCESS,
} from '../constants/reviewConstants';

const initialState = {
  reviews: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  createSuccess: false,
};

export const reviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_REVIEWS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_REVIEWS_SUCCESS:
      return { ...state, loading: false, reviews: action.payload };
    case FETCH_REVIEWS_FAIL:
      return { ...state, loading: false, error: action.payload };
    case CREATE_REVIEW_REQUEST:
      return { ...state, createLoading: true, createError: null, createSuccess: false };
    case CREATE_REVIEW_SUCCESS:
      return {
        ...state,
        createLoading: false,
        createError: null,
        createSuccess: true,
        reviews: [...state.reviews, action.payload], // Append the new review
      };
    case CREATE_REVIEW_FAIL:
      return { ...state, createLoading: false, createError: action.payload, createSuccess: false };
    case CLEAR_REVIEW_SUCCESS:
      return { ...state, createSuccess: false };
    default:
      return state;
  }
};