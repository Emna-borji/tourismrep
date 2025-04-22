// src/pages/ArchaeologicalSitesPage.jsx
import React from 'react';
import EntityListPage from '../Shared/EntityListPage';

const ArchaeologicalSitesPage = () => (
  <EntityListPage
    entityType="archaeological_site"
    itemType="Archaeological Sites"
    itemDetailsRoute="archaeological_site"
  />
);

export default ArchaeologicalSitesPage;