import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Tabs, Tab, Card, Accordion, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Import Link for navigation
import Sidebar from './Sidebar';
import { fetchUserProfile, updateUserProfile } from '../../redux/actions/authActions';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import { fetchCircuitHistory } from '../../redux/actions/circuitHistoryActions';
import './accountSettingsStyle.css';

const AccountSettings = () => {
  const dispatch = useDispatch();
  const { userInfo, loading: userLoading, error: userError } = useSelector((state) => state.auth);
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector((state) => state.destinations);
  const { circuitHistory, loading: historyLoading, error: historyError } = useSelector((state) => state.circuitHistory);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phonenumber: '',
    location_id: '',
    profilepic: '',
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    setActiveTab(tab === 'history' ? 'history' : 'profile');
  }, []);

  useEffect(() => {
    if (!userInfo) {
      dispatch(fetchUserProfile());
    }
    dispatch(fetchDestinations());
    dispatch(fetchCircuitHistory());
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

  const renderHistoryTab = () => {
    if (historyLoading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de l'historique...</p>
        </div>
      );
    }

    if (historyError) {
      return <Alert variant="danger">Erreur : {historyError}</Alert>;
    }

    if (!circuitHistory || circuitHistory.length === 0) {
      return <Alert variant="info">Vous n'avez aucun circuit dans votre historique.</Alert>;
    }

    return (
      <div className="circuit-history-list">
        <Accordion>
          {circuitHistory.map((history, index) => {
            const circuit = history.circuit || {};
            const departureCity = circuit.departure_city || 'Inconnue';
            const arrivalCity = circuit.arrival_city || 'Inconnue';
            const schedules = circuit.schedules || [];

            return (
              <Card key={history.id} className="circuit-card mb-3">
                <Accordion.Item eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="circuit-header">
                      <h5>{circuit.name || 'Circuit sans nom'}</h5>
                      <p className="text-muted">
                        {departureCity} → {arrivalCity} | {history.departure_date} - {history.arrival_date}
                      </p>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="circuit-details">
                      <p><strong>Nom :</strong> {circuit.name || 'N/A'}</p>
                      <p><strong>Code du circuit :</strong> {circuit.circuit_code || 'N/A'}</p>
                      <p><strong>Ville de départ :</strong> {departureCity}</p>
                      <p><strong>Ville d'arrivée :</strong> {arrivalCity}</p>
                      <p><strong>Durée :</strong> {circuit.duration ? `${circuit.duration} jour(s)` : 'N/A'}</p>
                      <p><strong>Prix :</strong> {circuit.price ? `${circuit.price} TND` : 'N/A'}</p>
                      <p><strong>Description :</strong> {circuit.description || 'Aucune description'}</p>
                      <h6 className="mt-3">Programme :</h6>
                      {schedules.length > 0 ? (
                        <ul className="schedule-list">
                          {schedules.map((schedule, idx) => (
                            <li key={idx} className="schedule-item">
                              <strong>
                                Jour {schedule.day || 'N/A'} -{' '}
                                {schedule.destination_id ? (
                                  <Link to={`/destination/${schedule.destination_id}`} className="entity-link">
                                    {schedule.destination_name || 'Inconnue'}
                                  </Link>
                                ) : (
                                  schedule.destination_name || 'Inconnue'
                                )}
                              </strong>
                              <ul>
                                <li><strong>Ordre :</strong> {schedule.order || 'N/A'}</li>
                                {schedule.distance_km && <li><strong>Distance :</strong> {schedule.distance_km} km</li>}
                                {schedule.hotel_name && (
                                  <li>
                                    <strong>Hôtel :</strong>{' '}
                                    <Link to={`/hotel/${schedule.hotel_id}`} className="entity-link">
                                      {schedule.hotel_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.guest_house_name && (
                                  <li>
                                    <strong>Maison d'hôte :</strong>{' '}
                                    <Link to={`/guest-house/${schedule.guest_house_id}`} className="entity-link">
                                      {schedule.guest_house_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.restaurant_name && (
                                  <li>
                                    <strong>Restaurant :</strong>{' '}
                                    <Link to={`/restaurant/${schedule.restaurant_id}`} className="entity-link">
                                      {schedule.restaurant_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.activity_name && (
                                  <li>
                                    <strong>Activité :</strong>{' '}
                                    <Link to={`/activity/${schedule.activity_id}`} className="entity-link">
                                      {schedule.activity_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.museum_name && (
                                  <li>
                                    <strong>Musée :</strong>{' '}
                                    <Link to={`/museum/${schedule.museum_id}`} className="entity-link">
                                      {schedule.museum_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.festival_name && (
                                  <li>
                                    <strong>Festival :</strong>{' '}
                                    <Link to={`/festival/${schedule.festival_id}`} className="entity-link">
                                      {schedule.festival_name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.archaeological_site_name && (
                                  <li>
                                    <strong>Site archéologique :</strong>{' '}
                                    <Link to={`/archaeological-site/${schedule.archaeological_site_id}`} className="entity-link">
                                      {schedule.archaeological_site_name}
                                    </Link>
                                  </li>
                                )}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Aucun programme disponible.</p>
                      )}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Card>
            );
          })}
        </Accordion>
      </div>
    );
  };

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
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                window.history.pushState(null, '', `/account-settings${k === 'history' ? '?tab=history' : ''}`);
              }}
              id="account-settings-tabs"
              className="mb-4"
            >
              <Tab eventKey="profile" title="Profil">
                {renderProfileTab()}
              </Tab>
              <Tab eventKey="history" title="Historique des circuits">
                {renderHistoryTab()}
              </Tab>
            </Tabs>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AccountSettings;