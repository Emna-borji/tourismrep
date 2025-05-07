import axios from 'axios';
import {
  FETCH_RECOMMENDATIONS_REQUEST,
  FETCH_RECOMMENDATIONS_SUCCESS,
  FETCH_RECOMMENDATIONS_FAILURE,
} from '../constants/recommendationsConstants';

export const fetchRecommendationsRequest = () => ({
  type: FETCH_RECOMMENDATIONS_REQUEST,
});

export const fetchRecommendationsSuccess = (recommendations) => ({
  type: FETCH_RECOMMENDATIONS_SUCCESS,
  payload: recommendations,
});

export const fetchRecommendationsFailure = (error) => ({
  type: FETCH_RECOMMENDATIONS_FAILURE,
  payload: error,
});

export const fetchRecommendations = () => {
  return async (dispatch) => {
    dispatch(fetchRecommendationsRequest());
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/tourism/recommendations/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch(fetchRecommendationsSuccess(response.data.recommendations));
    } catch (error) {
      dispatch(fetchRecommendationsFailure(error.message));
    }
  };
};