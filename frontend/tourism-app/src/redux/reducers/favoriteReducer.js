import { ADD_FAVORITE_FAILURE, ADD_FAVORITE_REQUEST, ADD_FAVORITE_SUCCESS, FETCH_FAVORITES_FAILURE, FETCH_FAVORITES_REQUEST, FETCH_FAVORITES_SUCCESS, REMOVE_FAVORITE_FAILURE, REMOVE_FAVORITE_REQUEST, REMOVE_FAVORITE_SUCCESS } from "../constants/favoriteConstants";

  
  const initialState = {
    favorites: [],
    loading: false,
    error: null,
  };
  
  const favoriteReducer = (state = initialState, action) => {
    switch (action.type) {
      case FETCH_FAVORITES_REQUEST:
      case ADD_FAVORITE_REQUEST:
      case REMOVE_FAVORITE_REQUEST:
        return { ...state, loading: true, error: null };
  
      case FETCH_FAVORITES_SUCCESS:
        return { ...state, loading: false, favorites: action.payload };
  
      case ADD_FAVORITE_SUCCESS:
        return {
          ...state,
          loading: false,
          favorites: [...state.favorites, { entity_type: action.payload.entityType, entity_id: action.payload.entityId }],
        };
  
      case REMOVE_FAVORITE_SUCCESS:
        return {
          ...state,
          loading: false,
          favorites: state.favorites.filter(
            (fav) => !(fav.entity_type === action.payload.entityType && fav.entity_id === action.payload.entityId)
          ),
        };
  
      case FETCH_FAVORITES_FAILURE:
      case ADD_FAVORITE_FAILURE:
      case REMOVE_FAVORITE_FAILURE:
        return { ...state, loading: false, error: action.payload };
  
      default:
        return state;
    }
  };
  
  export default favoriteReducer;