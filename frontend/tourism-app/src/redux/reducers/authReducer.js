import {
  REGISTER_USER_REQUEST,
  LOGIN_USER_REQUEST,
  LOGIN_USER_SUCCESS,
  REGISTER_USER_SUCCESS,
  LOGIN_USER_FAIL,
  REGISTER_USER_FAIL,
  FETCH_USER_PROFILE_REQUEST,
  FETCH_USER_PROFILE_SUCCESS,
  FETCH_USER_PROFILE_FAILURE,
  UPDATE_USER_PROFILE_REQUEST,
  UPDATE_USER_PROFILE_SUCCESS,
  UPDATE_USER_PROFILE_FAILURE,
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
  LOGOUT,
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAIL,
  BLOCK_USER_REQUEST,
  BLOCK_USER_SUCCESS,
  BLOCK_USER_FAIL,
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAIL,
} from '../constants/authConstants';

const initialState = {
  userInfo: null,
  users: [], // Store the list of users
  loading: false,
  error: null,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    // Authentication actions
    case REGISTER_USER_REQUEST:
    case LOGIN_USER_REQUEST:
    case FETCH_USER_PROFILE_REQUEST:
    case UPDATE_USER_PROFILE_REQUEST:
    case CHANGE_PASSWORD_REQUEST:
    case FETCH_USERS_REQUEST:
    case BLOCK_USER_REQUEST:
    case DELETE_USER_REQUEST:
      return { ...state, loading: true, error: null };

    case REGISTER_USER_SUCCESS:
    case LOGIN_USER_SUCCESS:
    case FETCH_USER_PROFILE_SUCCESS:
    case UPDATE_USER_PROFILE_SUCCESS:
      return { ...state, loading: false, userInfo: action.payload, error: null };

    case CHANGE_PASSWORD_SUCCESS:
    case BLOCK_USER_SUCCESS:
      return { ...state, loading: false, error: null };

    case FETCH_USERS_SUCCESS:
      return { ...state, loading: false, users: action.payload, error: null };

    case DELETE_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        users: state.users.filter((user) => user.id !== action.payload),
        error: null,
      };

    case REGISTER_USER_FAIL:
    case LOGIN_USER_FAIL:
    case FETCH_USER_PROFILE_FAILURE:
    case UPDATE_USER_PROFILE_FAILURE:
    case CHANGE_PASSWORD_FAILURE:
    case FETCH_USERS_FAIL:
    case BLOCK_USER_FAIL:
    case DELETE_USER_FAIL:
      return { ...state, loading: false, error: action.payload };

    case LOGOUT:
      return { ...state, userInfo: null, users: [], loading: false, error: null };

    default:
      return state;
  }
};