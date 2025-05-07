import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box } from '@mui/material';

const ItemCard = ({ item, onClick }) => {
  return (
    <Card
      sx={{
        maxWidth: 360,
        m: 2,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {item?.name || 'Inconnu'}
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={1.5}>
          {item?.description || 'Aucune description disponible.'}
        </Typography>

        {item?.price && (
          <Typography color="primary" fontWeight={500}>
            Prix: {item.price} TND
          </Typography>
        )}

        {item?.stars && (
          <Typography fontSize={14} color="text.secondary">
            Étoiles: {item.stars} ⭐
          </Typography>
        )}

        {item?.category_id && (
          <Typography fontSize={14} color="text.secondary">
            Catégorie: {item.category_id}
          </Typography>
        )}
      </CardContent>

      {onClick && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => onClick()}
            sx={{
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: 2,
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
