// import {
//     FETCH_USER_PROFILE_SUCCESS,
//     FETCH_USER_PROFILE_FAILURE,
//     UPDATE_USER_PROFILE_REQUEST,
//     UPDATE_USER_PROFILE_SUCCESS,
//     UPDATE_USER_PROFILE_FAILURE,
//     FETCH_USER_PROFILE_REQUEST,
//     CHANGE_PASSWORD_FAILURE,
//     CHANGE_PASSWORD_SUCCESS,
//     CHANGE_PASSWORD_REQUEST,
//     LOGOUT,
//   } from '../constants/userConstants';
  
//   const initialState = {
//     user: null,
//     loading: false,
//     error: null,
//   };
  
//   const userReducer = (state = initialState, action) => {
//     switch (action.type) {
//       case FETCH_USER_PROFILE_REQUEST:
//       case UPDATE_USER_PROFILE_REQUEST:
//       case CHANGE_PASSWORD_REQUEST:
//         return { ...state, loading: true, error: null };
  
//       case FETCH_USER_PROFILE_SUCCESS:
//         return { ...state, loading: false, user: action.payload };
//       case UPDATE_USER_PROFILE_SUCCESS:
//         return { ...state, loading: false, user: action.payload };
//       case CHANGE_PASSWORD_SUCCESS:
//         return { ...state, loading: false, error: null };
  
//       case FETCH_USER_PROFILE_FAILURE:
//       case UPDATE_USER_PROFILE_FAILURE:
//       case CHANGE_PASSWORD_FAILURE:
//         return { ...state, loading: false, error: action.payload };

//       case LOGOUT:
//         return { ...state, user: null, loading: false, error: null };
  
//       default:
//         return state;
//     }
//   };
  
//   export default userReducer;