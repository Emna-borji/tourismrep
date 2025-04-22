// src/pages/RestaurantsPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const RestaurantsPage = () => (
  <EntityListPage
    entityType="restaurant"
    itemType="Restaurants"
    itemDetailsRoute="restaurant"
  />
);

export default RestaurantsPage;