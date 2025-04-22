// src/pages/GuestHousesPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const GuestHousesPage = () => (
  <EntityListPage
    entityType="guest_house"
    itemType="Guest Houses"
    itemDetailsRoute="guest_house"
  />
);

export default GuestHousesPage;