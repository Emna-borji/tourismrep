// src/pages/FavoritesPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Spinner, Alert } from 'react-bootstrap';
import { fetchFavorites } from '../../redux/actions/favoriteActions';
import { Link } from 'react-router-dom';
import './favoritesPage.css';


const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { favorites, loading, error } = useSelector((state) => state.favorites);
  const { userInfo } = useSelector((state) => state.auth);
  const [filterEntityType, setFilterEntityType] = useState('');

  // Available entity types from the backend model
  const entityTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'activity', label: 'Activité' },
    { value: 'museum', label: 'Musée' },
    { value: 'hotel', label: 'Hôtel' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'guest_house', label: 'Maison d’hôtes' },
    { value: 'archaeological_site', label: 'Site archéologique' },
    { value: 'festival', label: 'Festival' },
  ];

  useEffect(() => {
    if (userInfo) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, userInfo]);

  const handleFilterChange = (e) => {
    setFilterEntityType(e.target.value);
  };

  // Filter favorites based on entity type
  const filteredFavorites = filterEntityType
    ? favorites.filter((favorite) => favorite.entity_type === filterEntityType)
    : favorites;

  return (
    <Container className="favorites-page my-5">
      <h1 className="text-center mb-4">Mes Favoris</h1>

      {/* Filter Dropdown */}
      <Row className="mb-4">
        <Col md={4} className="mx-auto">
          <Form.Group controlId="entityTypeFilter">
            <Form.Label>Filtrer par type d’entité</Form.Label>
            <Form.Select
              value={filterEntityType}
              onChange={handleFilterChange}
              className="shadow-sm"
            >
              {entityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}
      {!userInfo && (
        <Alert variant="warning" className="text-center">
          Veuillez vous connecter pour voir vos favoris.
        </Alert>
      )}

      {/* Favorites List */}
      {!loading && !error && userInfo && filteredFavorites.length === 0 && (
        <Alert variant="info" className="text-center">
          Vous n’avez aucun favori pour le moment.
        </Alert>
      )}
      <Row>
        {filteredFavorites.map((favorite) => {
          const { entityDetails } = favorite;
          if (!entityDetails) return null; // Skip if entity details failed to load

          // Determine route based on entity type
          const routeMap = {
            activity: '/activity-details',
            museum: '/museum-details',
            hotel: '/hotel-details',
            restaurant: '/restaurant-details',
            guest_house: '/guest-house-details',
            archaeological_site: '/archaeological-site-details',
            festival: '/festival-details',
          };
          const detailRoute = `${routeMap[favorite.entity_type]}/${favorite.entity_id}`;

          return (
            <Col key={`${favorite.entity_type}-${favorite.entity_id}`} md={4} className="mb-4">
              <Card className="favorite-card shadow-sm h-100">
                {entityDetails.image && (
                  <Card.Img
                    variant="top"
                    src={entityDetails.image}
                    alt={entityDetails.name}
                    className="favorite-card-img"
                  />
                )}
                <Card.Body>
                  <Card.Title className="favorite-card-title">
                    {entityDetails.name}
                  </Card.Title>
                  <Card.Text className="favorite-card-text">
                    <strong>Type:</strong> {entityTypes.find((type) => type.value === favorite.entity_type)?.label}
                    <br />
                    {entityDetails.location && (
                      <>
                        <strong>Lieu:</strong> {entityDetails.location}
                        <br />
                      </>
                    )}
                    {entityDetails.price && (
                      <>
                        <strong>Prix:</strong> {entityDetails.price} €
                      </>
                    )}
                  </Card.Text>
                  <Link to={detailRoute} className="btn btn-primary btn-sm">
                    Voir les détails
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default FavoritesPage;