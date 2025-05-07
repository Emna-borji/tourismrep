// src/reducers/reviewReducer.js
import {
  FETCH_REVIEWS_REQUEST,
  FETCH_REVIEWS_SUCCESS,
  FETCH_REVIEWS_FAIL,
  CREATE_REVIEW_REQUEST,
  CREATE_REVIEW_SUCCESS,
  CREATE_REVIEW_FAIL,
  CLEAR_REVIEW_SUCCESS,
  DELETE_REVIEW_REQUEST,
  DELETE_REVIEW_SUCCESS,
  DELETE_REVIEW_FAIL,
  UPDATE_REVIEW_REQUEST,
  UPDATE_REVIEW_SUCCESS,
  UPDATE_REVIEW_FAIL,
} from '../constants/reviewConstants';

const initialState = {
  reviews: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  createSuccess: false,
  deleteLoading: false,
  deleteError: null,
  updateLoading: false,
  updateError: null,
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

      case DELETE_REVIEW_REQUEST:
        return { ...state, deleteLoading: true, deleteError: null };
      case DELETE_REVIEW_SUCCESS:
        return {
          ...state,
          deleteLoading: false,
          deleteError: null,
          reviews: state.reviews.filter(review => review.id !== action.payload),
        };
      case DELETE_REVIEW_FAIL:
        return { ...state, deleteLoading: false, deleteError: action.payload };
      case UPDATE_REVIEW_REQUEST:
        return { ...state, updateLoading: true, updateError: null };
      case UPDATE_REVIEW_SUCCESS:
        return {
          ...state,
          updateLoading: false,
          updateError: null,
          reviews: state.reviews.map(review =>
            review.id === action.payload.id ? action.payload : review
          ),
        };
      case UPDATE_REVIEW_FAIL:
        return { ...state, updateLoading: false, updateError: action.payload };
    default:
      return state;
  }
};