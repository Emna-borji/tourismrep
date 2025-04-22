// import axios from 'axios';
// import {
//   FETCH_USER_PROFILE_REQUEST,
//   FETCH_USER_PROFILE_SUCCESS,
//   FETCH_USER_PROFILE_FAILURE,
//   UPDATE_USER_PROFILE_REQUEST,
//   UPDATE_USER_PROFILE_SUCCESS,
//   UPDATE_USER_PROFILE_FAILURE,
//   LOGOUT,
// } from '../constants/userConstants';
// import { CHANGE_PASSWORD_REQUEST } from '../constants/userConstants';
// import { CHANGE_PASSWORD_SUCCESS } from '../constants/userConstants';
// import { CHANGE_PASSWORD_FAILURE } from '../constants/userConstants';

// // Fetch user profile
// export const fetchUserProfile = () => async (dispatch) => {
//   dispatch({ type: FETCH_USER_PROFILE_REQUEST });

//   try {
//     const response = await axios.get('http://127.0.0.1:8000/api/profile/', {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth setup
//       },
//     });
//     dispatch({ type: FETCH_USER_PROFILE_SUCCESS, payload: response.data });
//   } catch (error) {
//     dispatch({
//       type: FETCH_USER_PROFILE_FAILURE,
//       payload: error.response ? error.response.data.message : error.message,
//     });
//   }
// };


// // Update user profile
// export const updateUserProfile = (profileData) => async (dispatch) => {
//   dispatch({ type: UPDATE_USER_PROFILE_REQUEST });

//   try {
//     const response = await axios.put('http://127.0.0.1:8000/api/profile/update/', profileData, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth setup
//       },
//     });
//     dispatch({ type: UPDATE_USER_PROFILE_SUCCESS, payload: response.data.data });
//   } catch (error) {
//     dispatch({
//       type: UPDATE_USER_PROFILE_FAILURE,
//       payload: error.response ? error.response.data.message : error.message,
//     });
//   }
// };



// // Change password
// export const changePassword = (passwordData) => async (dispatch) => {
//     dispatch({ type: CHANGE_PASSWORD_REQUEST });
  
//     try {
//       const response = await axios.post('http://127.0.0.1:8000/api/profile/change-password/', passwordData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//       });
//       console.log('Change password response:', response.data);
//       dispatch({ type: CHANGE_PASSWORD_SUCCESS });
//       return Promise.resolve(); // Return a resolved promise for success
//     } catch (error) {
//       console.error('Change password error:', error.response ? error.response.data : error.message);
//       dispatch({
//         type: CHANGE_PASSWORD_FAILURE,
//         payload: error.response ? error.response.data.message : error.message,
//       });
//       return Promise.reject(error); // Return a rejected promise for error handling
//     }
//   };



//   // Logout
// export const logout = () => (dispatch) => {
//     // Remove token from localStorage
//     localStorage.removeItem('token');
//     localStorage.removeItem('userInfo');
    
//     // Optionally, make an API call to invalidate the session on the backend
//     // If your backend has a logout endpoint (e.g., /api/logout/), you can call it here
//     /*
//     try {
//       await axios.post('http://127.0.0.1:8000/api/logout/', {}, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//       });
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//     */
  
//     // Dispatch logout action to reset user state
//     dispatch({ type: LOGOUT });
//   };