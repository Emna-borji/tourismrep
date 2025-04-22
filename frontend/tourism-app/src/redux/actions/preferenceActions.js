import axios from '../../api/api';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const SAVE_PREFERENCE_REQUEST = 'SAVE_PREFERENCE_REQUEST';
export const SAVE_PREFERENCE_SUCCESS = 'SAVE_PREFERENCE_SUCCESS';
export const SAVE_PREFERENCE_FAILURE = 'SAVE_PREFERENCE_FAILURE';
export const FETCH_PREFERENCE_REQUEST = 'FETCH_PREFERENCE_REQUEST';
export const FETCH_PREFERENCE_SUCCESS = 'FETCH_PREFERENCE_SUCCESS';
export const FETCH_PREFERENCE_FAILURE = 'FETCH_PREFERENCE_FAILURE';
export const FETCH_ACTIVITY_CATEGORIES_REQUEST = 'FETCH_ACTIVITY_CATEGORIES_REQUEST';
export const FETCH_ACTIVITY_CATEGORIES_SUCCESS = 'FETCH_ACTIVITY_CATEGORIES_SUCCESS';
export const FETCH_ACTIVITY_CATEGORIES_FAILURE = 'FETCH_ACTIVITY_CATEGORIES_FAILURE';
export const FETCH_CUISINES_REQUEST = 'FETCH_CUISINES_REQUEST';
export const FETCH_CUISINES_SUCCESS = 'FETCH_CUISINES_SUCCESS';
export const FETCH_CUISINES_FAILURE = 'FETCH_CUISINES_FAILURE';

// Fetch activity categories
export const fetchActivityCategories = () => async (dispatch) => {
  dispatch({ type: FETCH_ACTIVITY_CATEGORIES_REQUEST });
  try {
    const response = await axios.get('/api/tourism/activity-categories/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: FETCH_ACTIVITY_CATEGORIES_SUCCESS, payload: response.data });
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    dispatch({ type: FETCH_ACTIVITY_CATEGORIES_FAILURE, payload: errorMessage });
  }
};

// Fetch cuisines
export const fetchCuisines = () => async (dispatch) => {
  dispatch({ type: FETCH_CUISINES_REQUEST });
  try {
    const response = await axios.get('/api/tourism/cuisines/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: FETCH_CUISINES_SUCCESS, payload: response.data });
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    dispatch({ type: FETCH_CUISINES_FAILURE, payload: errorMessage });
  }
};

// Save preference
// export const savePreference = (preferenceData) => async (dispatch) => {
//   dispatch({ type: SAVE_PREFERENCE_REQUEST });
//   try {
//     console.log('Saving preference with data:', preferenceData);
//     const response = await axios.post('/api/preferences/', preferenceData, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`,
//       },
//     });
//     dispatch({ type: SAVE_PREFERENCE_SUCCESS, payload: response.data });
//     console.log(response.data)
//     return response.data;
//   } catch (error) {
//     const errorMessage = error.response?.data || error.message;
//     console.error('Preference save error:', errorMessage);
//     dispatch({
//       type: SAVE_PREFERENCE_FAILURE,
//       payload: errorMessage,
//     });
//     throw error;
//   }
// };
export const savePreference = createAsyncThunk(
  'preference/savePreference',
  async (preferenceData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/preferences/', preferenceData, {
        validateStatus: status => status >= 200 && status < 300, // Treat 2xx as success
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error occurred' });
    }
  }
);

// Fetch latest preference
export const fetchPreference = (userId) => async (dispatch) => {
  dispatch({ type: FETCH_PREFERENCE_REQUEST });
  try {
    const response = await axios.get(`/api/tourism/preferences/${userId}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    dispatch({ type: FETCH_PREFERENCE_SUCCESS, payload: response.data });
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    dispatch({
      type: FETCH_PREFERENCE_FAILURE,
      payload: errorMessage,
    });
  }
};