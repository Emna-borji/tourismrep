// src/components/EntityDescription.jsx
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const EntityDescription = ({ description }) => {
  if (!description) return null;

  return (
    <Row className="mb-4">
      <Col>
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Description</Card.Title>
            <Card.Text>{description}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default EntityDescription;