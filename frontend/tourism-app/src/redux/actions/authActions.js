import axios from '../../api/api';

import {
  LOGIN_USER_REQUEST,
  LOGIN_USER_SUCCESS,
  LOGIN_USER_FAIL,
  REGISTER_USER_REQUEST,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_FAIL,
  FETCH_USER_PROFILE_REQUEST,
  FETCH_USER_PROFILE_SUCCESS,
  FETCH_USER_PROFILE_FAILURE,
  LOGOUT,
  CHANGE_PASSWORD_REQUEST,
  UPDATE_USER_PROFILE_REQUEST,
  UPDATE_USER_PROFILE_SUCCESS,
  UPDATE_USER_PROFILE_FAILURE,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAIL,
  BLOCK_USER_REQUEST,
  BLOCK_USER_SUCCESS,
  BLOCK_USER_FAIL,
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAIL,
  EMAIL_EXISTS,
} from '../constants/authConstants';

// Login
export const login = (userData) => async (dispatch) => {
  dispatch({ type: LOGIN_USER_REQUEST });
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const { data } = await axios.post('/api/login/', userData, config);

    // Store token and user info in localStorage
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));

    dispatch({ type: LOGIN_USER_SUCCESS, payload: data });
    return data;
  } catch (error) {
    console.log('Login error details:', error.response?.data, error.message); // Debug log
    const errorMessage = error.response?.data?.error || error.response?.data?.non_field_errors || 'Échec de la connexion';
    dispatch({ type: LOGIN_USER_FAIL, payload: errorMessage });
    // Remove the throw statement to prevent uncaught error
  }
};

// Register
export const register = (userData) => async (dispatch) => {
  dispatch({ type: REGISTER_USER_REQUEST });
  try {
    const response = await axios.post('/api/register/', userData);
    // Check the response status after the request
    if (response.status === 409) {
      dispatch({ type: EMAIL_EXISTS, payload: response.data.message });
      return response.data; // Return the response to avoid throwing
    }

    // Success case
    console.log(response)
    console.log(response.data)
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    dispatch({ type: REGISTER_USER_SUCCESS, payload: response.data.user });
    return response.data;
  } catch (error) {
    // Handle other errors (e.g., 400 for validation errors)
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
    dispatch({ type: REGISTER_USER_FAIL, payload: errorMessage });
    throw error;
  }
};

// Fetch user profile
export const fetchUserProfile = () => async (dispatch) => {
  dispatch({ type: FETCH_USER_PROFILE_REQUEST });
  try {
    const response = await axios.get('/api/profile/');
    dispatch({ type: FETCH_USER_PROFILE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_USER_PROFILE_FAILURE, payload: error.response?.data?.error || 'Failed to fetch profile' });
  }
};

// Update user profile
export const updateUserProfile = (profileData) => async (dispatch) => {
  dispatch({ type: UPDATE_USER_PROFILE_REQUEST });
  try {
    const response = await axios.put('http://127.0.0.1:8000/api/profile/update/', profileData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: UPDATE_USER_PROFILE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: UPDATE_USER_PROFILE_FAILURE,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};

// Change password
export const changePassword = (passwordData) => async (dispatch) => {
  dispatch({ type: CHANGE_PASSWORD_REQUEST });
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/profile/change-password/', passwordData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: CHANGE_PASSWORD_SUCCESS });
    return Promise.resolve();
  } catch (error) {
    dispatch({
      type: CHANGE_PASSWORD_FAILURE,
      payload: error.response ? error.response.data.message : error.message,
    });
    return Promise.reject(error);
  }
};

// Logout


// Check auth status on app load
export const checkAuthStatus = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await axios.get('/api/profile/');
      dispatch({ type: LOGIN_USER_SUCCESS, payload: response.data });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      dispatch({ type: LOGOUT });
    }
  }
};

// Fetch all users (for admin)
export const fetchUsers = () => async (dispatch) => {
  dispatch({ type: FETCH_USERS_REQUEST });
  try {
    const response = await axios.get('/api/users/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    console.log('Fetched users:', response.data);
    dispatch({ type: FETCH_USERS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: FETCH_USERS_FAIL,
      payload: error.response?.data?.error || 'Failed to fetch users',
    });
  }
};

// Block/unblock a user
export const blockUser = (userId, blockData) => async (dispatch) => {
  console.log('Blocking/unblocking user:', userId, blockData);
  dispatch({ type: BLOCK_USER_REQUEST });
  try {
    const response = await axios.post(`/api/users/${userId}/block/`, blockData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: BLOCK_USER_SUCCESS, payload: { userId, blockData } });
    // Refetch users to update the list
    dispatch(fetchUsers());
    return response.data;
  } catch (error) {
    dispatch({
      type: BLOCK_USER_FAIL,
      payload: error.response?.data?.error || 'Failed to block/unblock user',
    });
    throw error;
  }
};

// Delete a user
export const deleteUser = (userId) => async (dispatch) => {
  dispatch({ type: DELETE_USER_REQUEST });
  try {
    await axios.delete(`/api/users/${userId}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: DELETE_USER_SUCCESS, payload: userId });
    // Refetch users to update the list
    dispatch(fetchUsers());
  } catch (error) {
    dispatch({
      type: DELETE_USER_FAIL,
      payload: error.response?.data?.error || 'Failed to delete user',
    });
    throw error;
  }
};


export const logout = () => (dispatch) => {
  // Since localStorage is cleared in the Navbar, we just dispatch the LOGOUT action here
  dispatch({ type: LOGOUT });
};