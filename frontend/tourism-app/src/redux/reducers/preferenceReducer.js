import {
  SAVE_PREFERENCE_REQUEST,
  SAVE_PREFERENCE_SUCCESS,
  SAVE_PREFERENCE_FAILURE,
  FETCH_PREFERENCE_REQUEST,
  FETCH_PREFERENCE_SUCCESS,
  FETCH_PREFERENCE_FAILURE,
  FETCH_ACTIVITY_CATEGORIES_REQUEST,
  FETCH_ACTIVITY_CATEGORIES_SUCCESS,
  FETCH_ACTIVITY_CATEGORIES_FAILURE,
  FETCH_CUISINES_REQUEST,
  FETCH_CUISINES_SUCCESS,
  FETCH_CUISINES_FAILURE,
} from '../actions/preferenceActions';

const initialState = {
  preference: null,
  activityCategories: [],
  cuisines: [],
  loading: false,
  error: null,
  activityCategoriesLoading: false,
  activityCategoriesError: null,
  cuisinesLoading: false,
  cuisinesError: null,
};

const preferenceReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_PREFERENCE_REQUEST:
    case FETCH_PREFERENCE_REQUEST:
      return { ...state, loading: true, error: null };
    case SAVE_PREFERENCE_SUCCESS:
    case FETCH_PREFERENCE_SUCCESS:
      return { ...state, preference: action.payload, loading: false, error: null };
    case SAVE_PREFERENCE_FAILURE:
    case FETCH_PREFERENCE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case FETCH_ACTIVITY_CATEGORIES_REQUEST:
      return { ...state, activityCategoriesLoading: true, activityCategoriesError: null };
    case FETCH_ACTIVITY_CATEGORIES_SUCCESS:
      return { ...state, activityCategories: action.payload, activityCategoriesLoading: false };
    case FETCH_ACTIVITY_CATEGORIES_FAILURE:
      return { ...state, activityCategoriesLoading: false, activityCategoriesError: action.payload };
    case FETCH_CUISINES_REQUEST:
      return { ...state, cuisinesLoading: true, cuisinesError: null };
    case FETCH_CUISINES_SUCCESS:
      return { ...state, cuisines: action.payload, cuisinesLoading: false };
    case FETCH_CUISINES_FAILURE:
      return { ...state, cuisinesLoading: false, cuisinesError: action.payload };
    default:
      return state;
  }
};

export default preferenceReducer;