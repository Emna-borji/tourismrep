import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMuseums } from '../../redux/actions/museumActions';
import ItemListPage from '../Shared/ItemListPage';

const MuseumsPage = () => {
  const dispatch = useDispatch();
  const { museums, loading, error } = useSelector((state) => state.museums);

  return (
    <ItemListPage
      fetchItems={fetchMuseums}
      items={museums}
      loading={loading}
      error={error}
      itemType="Museums"
      itemDetailsRoute="museum"
    />
  );
};

export default MuseumsPage;
