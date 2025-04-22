import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import { fetchFestivals } from '../../redux/actions/festivalActions';  // Ensure this import is correct

const FestivalsPage = () => {
  const dispatch = useDispatch();

  const { festivals, loading, error } = useSelector((state) => state.festivals);  // Adjust the state name according to your Redux store

  useEffect(() => {
    dispatch(fetchFestivals());  // Dispatch the fetchFestivals action to get the data
  }, [dispatch]);

  if (loading) {
    return <div className="d-flex justify-content-center mt-5"><Spinner animation="border" role="status" /></div>;
  }

  if (error) {
    return <p className="text-center text-danger">Error: {error}</p>;
  }

  return (
    <Container>
      <h1 className="text-center mt-5">Festivals</h1>
      <Row>
        {festivals.map((festival) => (
          <Col md={4} key={festival.id} className="mb-4">
            <Card>
              <Card.Img variant="top" src={festival.image} alt={festival.name} />
              <Card.Body>
                <Card.Title>{festival.name}</Card.Title>
                <Card.Text>{festival.description}</Card.Text>
                <Card.Text><strong>Date:</strong> {new Date(festival.date).toLocaleDateString()}</Card.Text>
                <Button variant="primary" href={`/festival/${festival.id}`}>View Details</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default FestivalsPage;
