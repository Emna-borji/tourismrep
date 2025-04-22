// store.js
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';  // Correct import
import rootReducer from './reducers'; // Import your combined reducers

export const store = createStore(
  rootReducer, // The root reducer combines all reducers
  applyMiddleware(thunk) // Add redux-thunk middleware for async actions
);

export default store;
