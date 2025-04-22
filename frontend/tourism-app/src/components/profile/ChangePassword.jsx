import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import Sidebar from './Sidebar';
import { changePassword } from '../../redux/actions/authActions'; // Updated import
import './changePasswordStyle.css';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth); // Updated to use state.auth

  // Local state for form fields
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  // State for success message
  const [successMessage, setSuccessMessage] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate that new password and confirmation match
    if (formData.new_password !== formData.confirm_new_password) {
      setSuccessMessage('');
      alert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    // Prepare data to send to the backend (exclude confirm_new_password)
    const dataToSend = {
      old_password: formData.old_password,
      new_password: formData.new_password,
    };

    console.log('Change password data being sent:', dataToSend);

    // Dispatch the change password action
    dispatch(changePassword(dataToSend))
      .then(() => {
        setSuccessMessage('Mot de passe changé avec succès !');
        setFormData({
          old_password: '',
          new_password: '',
          confirm_new_password: '',
        });
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      })
      .catch(() => {
        setSuccessMessage('');
      });
  };

  return (
    <Container fluid className="change-password-container">
      <Row>
        <Col md={3}>
          <Sidebar />
        </Col>
        <Col md={9}>
          <div className="change-password-content">
            <h1>Changer le mot de passe</h1>
            {successMessage && (
              <Alert variant="success">
                {successMessage}
              </Alert>
            )}
            {error && (
              <Alert variant="danger">
                Erreur : {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="old_password" className="mb-3">
                <Form.Label>Ancien mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="new_password" className="mb-3">
                <Form.Label>Nouveau mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="confirm_new_password" className="mb-3">
                <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="confirm_new_password"
                  value={formData.confirm_new_password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ChangePassword;