import React from 'react';
import { Row, Col } from 'react-bootstrap';
import './entityDescription.css';

const EntityDescription = ({ description }) => {
  if (!description) return null;

  return (
    <Row className="mb-4">
      <Col>
        <div className="entity-description">
          <h2 className="description-title">Description</h2>
          <p className="description-text">{description}</p>
        </div>
      </Col>
    </Row>
  );
};

export default EntityDescription;