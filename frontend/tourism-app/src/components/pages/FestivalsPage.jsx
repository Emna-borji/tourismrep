// src/pages/FestivalsPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const FestivalsPage = () => (
  <EntityListPage
    entityType="festival"
    itemType="Festivals"
    itemDetailsRoute="festival"
  />
);

export default FestivalsPage;