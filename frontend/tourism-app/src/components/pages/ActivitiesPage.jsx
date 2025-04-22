// src/pages/ActivitiesPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const ActivitiesPage = () => (
  <EntityListPage
    entityType="activity"
    itemType="Activities"
    itemDetailsRoute="activity"
  />
);

export default ActivitiesPage;