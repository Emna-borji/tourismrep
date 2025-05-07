import axios from '../../api/api';
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

export const fetchGuides = () => async (dispatch) => {
  dispatch({ type: FETCH_GUIDES_REQUEST });
  try {
    const response = await axios.get('/api/itinerary/guides/');
    dispatch({
      type: FETCH_GUIDES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FETCH_GUIDES_FAIL,
      payload: error.response?.data?.error || 'Failed to fetch guides',
    });
  }
};

export const fetchGuideById = (id) => async (dispatch) => {
  dispatch({ type: FETCH_GUIDE_REQUEST });
  try {
    const response = await axios.get(`/api/itinerary/guides/${id}/`);
    dispatch({ type: FETCH_GUIDE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: FETCH_GUIDE_FAIL,
      payload: error.response?.data?.error || 'Failed to fetch guide',
    });
  }
};

export const createGuide = (guideData) => async (dispatch, getState) => {
  dispatch({ type: CREATE_GUIDE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.post('/api/itinerary/guides/', guideData, config);
    dispatch({ type: CREATE_GUIDE_SUCCESS, payload: response.data });
    dispatch(fetchGuides()); // Refresh the list
  } catch (error) {
    dispatch({
      type: CREATE_GUIDE_FAIL,
      payload: error.response?.data?.error || 'Failed to create guide',
    });
  }
};

export const updateGuide = (id, guideData) => async (dispatch, getState) => {
  dispatch({ type: UPDATE_GUIDE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.put(`/api/itinerary/guides/${id}/`, guideData, config);
    dispatch({ type: UPDATE_GUIDE_SUCCESS, payload: response.data });
    dispatch(fetchGuides()); // Refresh the list
  } catch (error) {
    console.log('Update Guide Error:', error.response?.data); 
    dispatch({
      type: UPDATE_GUIDE_FAIL,
      payload: error.response?.data?.error || 'Failed to update guide',
    });
  }
};

export const deleteGuide = (id) => async (dispatch, getState) => {
  dispatch({ type: DELETE_GUIDE_REQUEST });
  try {
    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    await axios.delete(`/api/itinerary/guides/${id}/`, config);
    dispatch({ type: DELETE_GUIDE_SUCCESS, payload: id });
    dispatch(fetchGuides()); // Refresh the list
  } catch (error) {
    dispatch({
      type: DELETE_GUIDE_FAIL,
      payload: error.response?.data?.error || 'Failed to delete guide',
    });
  }
};