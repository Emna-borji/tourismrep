import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GuestHouseDetailsPage = () => {
  const { guestHouseId } = useParams();
  const { guestHouses } = useSelector((state) => state.guestHouses);
  const [guestHouse, setGuestHouse] = useState(null);

  useEffect(() => {
    const foundGuestHouse = guestHouses.find((g) => g.id === guestHouseId);
    setGuestHouse(foundGuestHouse);
  }, [guestHouseId, guestHouses]);

  if (!guestHouse) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{guestHouse.name}</h1>
      <img src={guestHouse.image} alt={guestHouse.name} />
      <p>{guestHouse.description}</p>
      <p>Location: {guestHouse.location}</p>
      <p>Price: {guestHouse.price}</p>
    </div>
  );
};

export default GuestHouseDetailsPage;
