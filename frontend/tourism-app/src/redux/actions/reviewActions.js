// src/actions/reviewActions.js
import axios from '../../api/api';
import {
  FETCH_REVIEWS_REQUEST,
  FETCH_REVIEWS_SUCCESS,
  FETCH_REVIEWS_FAIL,
  CREATE_REVIEW_REQUEST,
  CREATE_REVIEW_SUCCESS,
  CREATE_REVIEW_FAIL,
  CLEAR_REVIEW_SUCCESS,
} from '../constants/reviewConstants';

// Fetch reviews for an entity
export const fetchReviews = (entityType, entityId) => async (dispatch) => {
  dispatch({ type: FETCH_REVIEWS_REQUEST });
  try {
    
    const response = await axios.get(`/api/tourism/reviews/`, {
      params: { entity_type: entityType, entity_id: entityId },
    });
    dispatch({ type: FETCH_REVIEWS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: FETCH_REVIEWS_FAIL,
      payload: error.response?.data?.error || `Failed to fetch reviews for ${entityType}`,
    });
  }
};

// Create a new review
export const createReview = (entityType, entityId, reviewData) => async (dispatch, getState) => {
  dispatch({ type: CREATE_REVIEW_REQUEST });
  try {
    console.log("reviews");
    console.log(entityId);
    console.log(entityType);
    console.log(reviewData);

    // Validate rating
    const { rating } = reviewData;
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Please select a rating between 1 and 5.");
    }

    const { auth: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const response = await axios.post(`/api/tourism/reviews/`, {
      entity_type: entityType,
      entity_id: entityId,
      ...reviewData,
    }, config);
    dispatch({ type: CREATE_REVIEW_SUCCESS, payload: response.data }); // Use the new review as payload
    // Refetch reviews after creating a new one
    dispatch(fetchReviews(entityType, entityId));
  } catch (error) {
    let errorMessage = 'Failed to create review';
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object' && !error.response.data.error) {
        errorMessage = Object.values(error.response.data)
          .flat()
          .join(' ');
      } else {
        errorMessage = error.response.data.error || error.message || errorMessage;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }
    dispatch({
      type: CREATE_REVIEW_FAIL,
      payload: errorMessage,
    });
  }
};


export const clearReviewSuccess = () => ({
  type: CLEAR_REVIEW_SUCCESS,
});