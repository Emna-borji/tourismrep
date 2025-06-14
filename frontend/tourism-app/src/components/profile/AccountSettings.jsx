import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import Sidebar from './Sidebar';
import { fetchUserProfile, updateUserProfile } from '../../redux/actions/authActions';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import './accountSettingsStyle.css';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const { userInfo, loading: userLoading, error: userError } = useSelector((state) => state.auth);
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector((state) => state.destinations);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phonenumber: '',
    location_id: '',
    profilepic: '',
  });

  useEffect(() => {
    if (!userInfo) {
      dispatch(fetchUserProfile());
    }
    dispatch(fetchDestinations());
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        firstname: userInfo.firstname || '',
        lastname: userInfo.lastname || '',
        phonenumber: userInfo.phonenumber || '',
        location_id: userInfo.location ? userInfo.location.id : '',
        profilepic: userInfo.profilepic || '',
      });
    }
  }, [userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(formData));
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Échec de la mise à jour du profil:', error);
    }
  };

  const renderProfileTab = () => (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="firstname" className="mb-3">
        <Form.Label>Prénom</Form.Label>
        <Form.Control
          type="text"
          name="firstname"
          value={formData.firstname}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group controlId="lastname" className="mb-3">
        <Form.Label>Nom de famille</Form.Label>
        <Form.Control
          type="text"
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group controlId="phonenumber" className="mb-3">
        <Form.Label>Numéro de téléphone</Form.Label>
        <Form.Control
          type="text"
          name="phonenumber"
          value={formData.phonenumber}
          onChange={handleChange}
          placeholder="1234567890"
        />
      </Form.Group>

      <Form.Group controlId="location_id" className="mb-3">
        <Form.Label>Localisation</Form.Label>
        <Form.Select
          name="location_id"
          value={formData.location_id}
          onChange={handleChange}
        >
          <option value="">Sélectionnez une destination</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group controlId="profilepic" className="mb-3">
        <Form.Label>URL de la photo de profil</Form.Label>
        <Form.Control
          type="url"
          name="profilepic"
          value={formData.profilepic}
          onChange={handleChange}
          placeholder="https://example.com/profilepic.jpg"
        />
      </Form.Group>

      <Button variant="primary" type="submit" disabled={userLoading}>
        Enregistrer les modifications
      </Button>
    </Form>
  );

  if (userLoading || destinationsLoading) {
    return <div>Chargement...</div>;
  }

  if (userError) {
    return <div>Erreur : {userError}</div>;
  }

  if (destinationsError) {
    return <div>Erreur lors du chargement des destinations : {destinationsError}</div>;
  }

  if (!userInfo) {
    return <div>Utilisateur non connecté. Veuillez vous connecter.</div>;
  }

  return (
    <Container fluid className="account-settings-container">
      <Row>
        <Col md={3}>
          <Sidebar />
        </Col>
        <Col md={9}>
          <div className="account-settings-content">
            <h1>Paramètres du compte</h1>
            {renderProfileTab()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AccountSettings;