import {
    FETCH_GUIDES_REQUEST,
    FETCH_GUIDES_SUCCESS,
    FETCH_GUIDES_FAIL,
    FETCH_GUIDE_REQUEST,
    FETCH_GUIDE_SUCCESS,
    FETCH_GUIDE_FAIL,
    CREATE_GUIDE_REQUEST,
    CREATE_GUIDE_SUCCESS,
    CREATE_GUIDE_FAIL,
    UPDATE_GUIDE_REQUEST,
    UPDATE_GUIDE_SUCCESS,
    UPDATE_GUIDE_FAIL,
    DELETE_GUIDE_REQUEST,
    DELETE_GUIDE_SUCCESS,
    DELETE_GUIDE_FAIL,
  } from '../constants/guideConstants';
  
  const initialState = {
    guides: [],
    loading: false,
    error: null,
    guide: null,
    createLoading: false,
    createError: null,
    updateLoading: false,
    updateError: null,
    deleteLoading: false,
    deleteError: null,
  };
  
  export const guideReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_GUIDES_REQUEST:
      case FETCH_GUIDE_REQUEST:
        return { ...state, loading: true, error: null };
      case FETCH_GUIDES_SUCCESS:
        return {
          ...state,
          loading: false,
          guides: action.payload,
        };
      case FETCH_GUIDE_SUCCESS:
        return { ...state, loading: false, guide: action.payload };
      case FETCH_GUIDES_FAIL:
      case FETCH_GUIDE_FAIL:
        return { ...state, loading: false, error: action.payload };
      case CREATE_GUIDE_REQUEST:
        return { ...state, createLoading: true, createError: null };
      case CREATE_GUIDE_SUCCESS:
        return { ...state, createLoading: false, createError: null };
      case CREATE_GUIDE_FAIL:
        return { ...state, createLoading: false, createError: action.payload };
      case UPDATE_GUIDE_REQUEST:
        return { ...state, updateLoading: true, updateError: null };
      case UPDATE_GUIDE_SUCCESS:
        return { ...state, updateLoading: false, updateError: null };
      case UPDATE_GUIDE_FAIL:
        return { ...state, updateLoading: false, updateError: action.payload };
      case DELETE_GUIDE_REQUEST:
        return { ...state, deleteLoading: true, deleteError: null };
      case DELETE_GUIDE_SUCCESS:
        return { ...state, deleteLoading: false, deleteError: null };
      case DELETE_GUIDE_FAIL:
        return { ...state, deleteLoading: false, deleteError: action.payload };
      default:
        return state;
    }
  };