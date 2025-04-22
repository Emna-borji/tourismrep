// src/components/EditEntityModal.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { fetchDestinations } from '../redux/actions/destinationActions'; // Update import

const EditEntityModal = ({
  show,
  onHide,
  entityType,
  formData,
  handleInputChange,
  handleEditSubmit,
  updateLoading,
  updateError,
}) => {
  const dispatch = useDispatch();
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector((state) => state.destinations); // Update to read from state.destinations

  useEffect(() => {
    if (show) {
      dispatch(fetchDestinations());
    }
  }, [dispatch, show]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {updateError && <Alert variant="danger">{updateError}</Alert>}
        {destinationsError && <Alert variant="danger">{destinationsError}</Alert>}
        <Form onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="text"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Website</Form.Label>
            <Form.Control
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
            />
          </Form.Group>
          {entityType === 'restaurant' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Forks (1-3)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="3"
                  name="forks"
                  value={formData.forks}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </>
          )}
          {(entityType === 'restaurant' || entityType === 'hotel' || entityType === 'guest_house' || entityType === 'activity' || entityType === 'festival' || entityType === 'museum' || entityType === 'archaeological_site') && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </>
          )}
          {entityType === 'hotel' && (
            <Form.Group className="mb-3">
              <Form.Label>Stars (1-5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                name="stars"
                value={formData.stars}
                onChange={handleInputChange}
              />
            </Form.Group>
          )}
          {entityType === 'guest_house' && (
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="Basique">Basique</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Luxe">Luxe</option>
              </Form.Select>
            </Form.Group>
          )}
          {entityType === 'festival' && (
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </Form.Group>
          )}
          {entityType === 'museum' && (
            <Form.Group className="mb-3">
              <Form.Label>Hours (e.g., 9 AM - 5 PM)</Form.Label>
              <Form.Control
                type="text"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
              />
            </Form.Group>
          )}
          {entityType === 'archaeological_site' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Period</Form.Label>
                <Form.Control
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Site Type</Form.Label>
                <Form.Control
                  type="text"
                  name="site_type"
                  value={formData.site_type}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Destination</Form.Label>
            <Form.Select
              name="destination_id"
              value={formData.destination_id || ''}
              onChange={handleInputChange}
              disabled={destinationsLoading}
            >
              <option value="">Select a destination</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </Form.Select>
            {destinationsLoading && <Spinner animation="border" size="sm" className="ms-2" />}
          </Form.Group>
          <Button type="submit" disabled={updateLoading} className="submit-btn">
            {updateLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditEntityModal;