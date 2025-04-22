// src/pages/HotelsPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const HotelsPage = () => (
  <EntityListPage
    entityType="hotel"
    itemType="Hotels"
    itemDetailsRoute="hotel"
  />
);

export default HotelsPage;