// src/redux/reducers/index.js
import { combineReducers } from 'redux';
import { authReducer } from './authReducer';
import { destinationReducer } from './destinationReducer';
import { restaurantReducer } from './restaurantReducer';
import hotelsReducer from './hotelReducer';
import museumReducer from './museumReducer';
import guestHouseReducer from './guestHouseReducer';
import userReducer from './userReducer';
import favoriteReducer from './favoriteReducer';
import { entityReducer } from './entityReducer';
import { reviewReducer } from './reviewReducer';
import { saveSearchReducer, trackClickReducer } from './searchReducer';
import circuitReducer from './circuitReducer';
import preferenceReducer from './preferenceReducer';


export const rootReducer = combineReducers({
  auth: authReducer,
  destinations: destinationReducer,
  restaurants: restaurantReducer,
  hotels: hotelsReducer,
  museums: museumReducer,
  guestHouses: guestHouseReducer,
  user: userReducer,
  favorites: favoriteReducer,
  entities: entityReducer,
  reviews: reviewReducer,
  saveSearch: saveSearchReducer,
  trackClick: trackClickReducer,
  circuit: circuitReducer,
  preference: preferenceReducer,
});

export default rootReducer;
