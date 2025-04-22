import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FestivalDetailsPage = () => {
  const { festivalId } = useParams();
  const { festivals } = useSelector((state) => state.festivals);
  const [festival, setFestival] = useState(null);

  useEffect(() => {
    const foundFestival = festivals.find((f) => f.id === festivalId);
    setFestival(foundFestival);
  }, [festivalId, festivals]);

  if (!festival) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{festival.name}</h1>
      <img src={festival.image} alt={festival.name} />
      <p>{festival.description}</p>
      <p>{festival.date}</p>
      <p>Price: {festival.price}</p>
    </div>
  );
};

export default FestivalDetailsPage;
