// src/components/DeleteEntityModal.jsx
import React from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';

const DeleteEntityModal = ({
  show,
  onHide,
  entityType,
  handleDelete,
  deleteLoading,
  deleteError,
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
        Are you sure you want to delete this {entityType}? This action cannot be undone.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? <Spinner animation="border" size="sm" /> : 'Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteEntityModal;