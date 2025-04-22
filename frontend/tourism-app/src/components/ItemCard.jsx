import React from 'react';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';

const ItemCard = ({ item, onClick }) => {
  console.log('ItemCard props:', { item, onClick }); // Debug
  return (
    <Card sx={{ maxWidth: 345, m: 1, position: 'relative', zIndex: 1 }}>
      <CardContent>
        <Typography variant="h6">{item?.name || 'Unknown'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {item?.description || 'No details available'}
        </Typography>
        {item?.price && <Typography>Prix: {item.price} TND</Typography>}
        {item?.stars && <Typography>Étoiles: {item.stars}</Typography>}
        {item?.category_id && (
          <Typography>Catégorie: {item.category_id}</Typography>
        )}
      </CardContent>
      {onClick && (
        <CardActions>
          <Button
            size="small"
            onClick={() => {
              console.log('Select button clicked for:', item.name); // Debug
              onClick();
            }}
          >
            Sélectionner
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default ItemCard;