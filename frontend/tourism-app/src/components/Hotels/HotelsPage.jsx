import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotels } from '../../redux/actions/hotelActions'; // Import the action to fetch hotels
import { Card, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import ItemListPage from '../Shared/ItemListPage';

const HotelsPage = () => {
    const dispatch = useDispatch();
    const { hotels, loading, error } = useSelector((state) => state.hotels);
  
    return (
      <ItemListPage 
        fetchItems={fetchHotels} 
        items={hotels} 
        loading={loading} 
        error={error} 
        itemType="Hotels" 
        itemDetailsRoute="hotel" 
      />
    );
  };

export default HotelsPage;
