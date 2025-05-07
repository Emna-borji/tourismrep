import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCircuit } from '../redux/actions/circuitActions'; // Assume this action exists

const CircuitCard = ({ circuit }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth || {});
  const isAdmin = userInfo?.role==="admin" || false;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${circuit.name}? This action cannot be undone.`)) {
      dispatch(deleteCircuit(circuit.id));
    }
  };

  return (
    <Card className="circuit-card mb-4 shadow-sm">
      <Card.Img variant="top" src={circuit.image} alt={circuit.name} />
      <Card.Body>
        <Card.Title>{circuit.name}</Card.Title>
        <Button
          variant="primary"
          className="voir-descriptif-btn"
          onClick={() => navigate(`/circuit/${circuit.id}`)}
        >
          Voir Descriptif
        </Button>
        {isAdmin && (
          <Button
            variant="danger"
            className="ms-2 mt-2 w-100"
            onClick={handleDelete}
          >
            Supprimer
          </Button>
        )}
        <div className="price-text mt-2">
          à partir de {circuit.price} DT /per
        </div>
      </Card.Body>
    </Card>
  );
};

export default CircuitCard;