import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FaMapMarkerAlt, FaLocationArrow, FaHeart, FaRegHeart } from 'react-icons/fa';
import { fetchFavorites, addToFavorite, removeFromFavorite } from '../../redux/actions/favoriteActions';
import { trackClick } from '../../redux/actions/searchActions';
import { renderStars, renderForks } from '../../utils/renderIcons';
import './ItemListPage.css';

const ItemListPage = ({ items, loading, error, itemType, itemDetailsRoute, entityType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading: authLoading } = useSelector((state) => state.auth);
  const { favorites } = useSelector((state) => state.favorites);
  const { loading: trackClickLoading, error: trackClickError } = useSelector((state) => state.trackClick);

  useEffect(() => {
    if (userInfo) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, userInfo]);

  const handleFavoriteToggle = async (itemId) => {
    if (authLoading) {
      return;
    }
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const isFavorited = favorites.some(
      (fav) => fav.entity_type === entityType && fav.entity_id === itemId
    );

    try {
      if (isFavorited) {
        await dispatch(removeFromFavorite(entityType, itemId));
      } else {
        await dispatch(addToFavorite(entityType, itemId));
      }
    } catch (err) {
      console.error(`Error toggling favorite for ${entityType}:`, err);
    }
  };

  const handleDetailsClick = async (itemId) => {
    if (userInfo) {
      await dispatch(trackClick(entityType, itemId));
      if (trackClickError) {
        console.error('Error tracking click:', trackClickError);
        if (trackClickError.includes('401')) {
          navigate('/login');
          return;
        }
      }
    }

    navigate(`/${itemDetailsRoute}/${itemId}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger">Error: {error}</p>;
  }

  return (
    <Container>
      <Row className="mt-4">
        {items.map((item) => {
          const isFavorited = favorites.some(
            (fav) => fav.entity_type === entityType && fav.entity_id === item.id
          );

          return (
            <Col md={4} key={item.id} className="mb-4">
              <Card className="custom-card h-100 shadow-sm position-relative">
                <Card.Img
                  variant="top"
                  src={item.image || item.image_url || item.images}
                  alt={item.name}
                  className="custom-card-img"
                />
                {(item.forks || item.stars) && (
                  <div className="rating-badge-image">
                    {entityType === 'restaurant' && item.forks && renderForks(item.forks, 3)}
                    {entityType === 'hotel' && item.stars && renderStars(item.stars, 5)}
                  </div>
                )}
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <Card.Title className="custom-title">{item.name}</Card.Title>
                    {item.address && (
                      <Card.Text className="custom-location">
                        <FaMapMarkerAlt className="me-2" size={30} />
                        <span className="address-text">{item.address}</span>
                      </Card.Text>
                    )}
                    {item.destination && (
                      <Card.Text className="custom-region">
                        <FaLocationArrow className="me-2 text-dark" size={16} />
                        {item.destination}
                      </Card.Text>
                    )}
                    {entityType === 'guest_house' && item.category && (
                      <Card.Text>
                        Catégorie: {item.category}
                      </Card.Text>
                    )}
                    {entityType === 'festival' && item.date && (
                      <Card.Text>
                        Date: {item.date}
                      </Card.Text>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    {item.price && (
                      <div className="price-stack">
                        <div className="price-prefix">à partir de</div>
                        <div className="price-value"><strong>{item.price} DT</strong></div>
                      </div>
                    )}
                    <Button
                      onClick={() => handleDetailsClick(item.id)}
                      className="custom-details-btn"
                      disabled={trackClickLoading}
                    >
                      {trackClickLoading ? 'Chargement...' : 'Plus de détails'}
                    </Button>
                  </div>
                </Card.Body>
                <div className="favorite-icon" onClick={() => handleFavoriteToggle(item.id)}>
                  {isFavorited ? (
                    <FaHeart color="red" size={24} />
                  ) : (
                    <FaRegHeart color="gray" size={24} />
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default ItemListPage;