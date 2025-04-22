import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGuestHouses } from '../../redux/actions/guestHouseActions'; // Your action for fetching guest houses
import ItemListPage from '../Shared/ItemListPage';

const GuestHousePage = () => {
  const dispatch = useDispatch();

  const { guestHouses, loading, error } = useSelector((state) => state.guestHouses);  // Adjust according to your Redux state

  // Fetch guest houses when the component mounts
  const fetchItems = () => dispatch(fetchGuestHouses());

  return (
    <ItemListPage
      fetchItems={fetchItems}
      items={guestHouses}
      loading={loading}
      error={error}
      itemType="Guest Houses"
      itemDetailsRoute="/guest-house/:100"  // This should be the route for the guest house details page
    />
  );
};

export default GuestHousePage;
