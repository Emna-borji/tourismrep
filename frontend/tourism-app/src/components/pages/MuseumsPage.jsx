// src/pages/MuseumsPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const MuseumsPage = () => (
  <EntityListPage
    entityType="museum"
    itemType="Museums"
    itemDetailsRoute="museum"
  />
);

export default MuseumsPage;