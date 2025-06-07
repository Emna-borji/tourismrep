import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Accordion, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import { fetchCircuitHistory } from '../../redux/actions/circuitHistoryActions';
import './circuitHistory.css';

const CircuitHistory = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector((state) => state.destinations);
  const { circuitHistory, loading: historyLoading, error: historyError } = useSelector((state) => state.circuitHistory);

  useEffect(() => {
    dispatch(fetchDestinations());
    dispatch(fetchCircuitHistory());
  }, [dispatch]);

  const renderHistoryContent = () => {
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
            const circuit = history.circuit_details || {};
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
                                    {destinations.find(d => d.id === schedule.destination_id)?.name || schedule.destination_name || 'Inconnue'}
                                  </Link>
                                ) : (
                                  schedule.destination_name || 'Inconnue'
                                )}
                              </strong>
                              <ul>
                                <li><strong>Ordre :</strong> {schedule.order || 'N/A'}</li>
                                {schedule.distance_km && <li><strong>Distance :</strong> {schedule.distance_km} km</li>}
                                {schedule.hotel?.name && (
                                  <li>
                                    <strong>Hôtel :</strong>{' '}
                                    <Link to={`/hotel/${schedule.hotel?.id}`} className="entity-link">
                                      {schedule.hotel.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.guest_house?.name && (
                                  <li>
                                    <strong>Maison d'hôte :</strong>{' '}
                                    <Link to={`/guest-house/${schedule.guest_house?.id}`} className="entity-link">
                                      {schedule.guest_house.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.restaurant?.name && (
                                  <li>
                                    <strong>Restaurant :</strong>{' '}
                                    <Link to={`/restaurant/${schedule.restaurant?.id}`} className="entity-link">
                                      {schedule.restaurant.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.activity?.name && (
                                  <li>
                                    <strong>Activité :</strong>{' '}
                                    <Link to={`/activities/${schedule.activity?.id}`} className="entity-link">
                                      {schedule.activity.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.museum?.name && (
                                  <li>
                                    <strong>Musée :</strong>{' '}
                                    <Link to={`/museum/${schedule.museum?.id}`} className="entity-link">
                                      {schedule.museum.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.festival?.name && (
                                  <li>
                                    <strong>Festival :</strong>{' '}
                                    <Link to={`/festival/${schedule.festival?.id}`} className="entity-link">
                                      {schedule.festival.name}
                                    </Link>
                                  </li>
                                )}
                                {schedule.archaeological_site?.name && (
                                  <li>
                                    <strong>Site archéologique :</strong>{' '}
                                    <Link to={`/archaeological-site/${schedule.archaeological_site?.id}`} className="entity-link">
                                      {schedule.archaeological_site.name}
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

  if (destinationsLoading) {
    return <div>Chargement...</div>;
  }

  if (destinationsError) {
    return <div>Erreur lors du chargement des destinations : {destinationsError}</div>;
  }

  if (!userInfo) {
    return <div>Utilisateur non connecté. Veuillez vous connecter.</div>;
  }

  return (
    <Container fluid className="circuit-history-container">
      <div className="circuit-history-content">
        <h1>Historique des Circuits</h1>
        {renderHistoryContent()}
      </div>
    </Container>
  );
};

export default CircuitHistory;