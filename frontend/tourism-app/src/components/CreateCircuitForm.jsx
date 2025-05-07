import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button, Form, Row, Col, Card, ListGroup, Alert } from 'react-bootstrap';
import { fetchEntities, clearEntities } from '../redux/actions/entityActions';
import { adminCreateCircuit } from '../redux/actions/circuitActions';
import { fetchDestinations } from '../redux/actions/destinationActions';

const CreateCircuitForm = ({ show, onHide }) => {
  const dispatch = useDispatch();
  const entityState = useSelector(state => state.entities || { entities: [], circuitEntities: [], loading: false, error: null });
  const { circuitEntities, loading: entitiesLoading, error: entitiesError } = entityState;
  const { userInfo } = useSelector(state => state.auth || {});
  const { adminCreateLoading, adminCreateError } = useSelector(state => state.circuit || {});
  const { destinations, loading: destinationsLoading, error: destinationsError } = useSelector(state => state.destinations || { destinations: [], loading: false, error: '' });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [itinerary, setItinerary] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [formError, setFormError] = useState(null);
  const [destinationEntities, setDestinationEntities] = useState({});

  console.log('CreateCircuitForm props:', { show, onHide });
  console.log('CreateCircuitForm userInfo:', userInfo);
  console.log('Destinations from Redux:', destinations);
  console.log('Circuit Entities from Redux:', circuitEntities);
  console.log('Destination Entities (Local State):', destinationEntities);

  useEffect(() => {
    if (!destinations.length) {
      dispatch(fetchDestinations());
    }
  }, [dispatch, destinations.length]);

  useEffect(() => {
    if (show) {
      dispatch(clearEntities());
      setDestinationEntities({});
      setItinerary([
        {
          destination_id: '',
          day: 1,
          order: 1,
          distance_km: 0,
          entities: { hotel: '', guest_house: '' },
          optionalEntities: { restaurant: [], activity: [], festival: [], museum: [], archaeological_site: [] },
        },
        {
          destination_id: '',
          day: 2,
          order: 2,
          distance_km: 0,
          entities: { hotel: '', guest_house: '' },
          optionalEntities: { restaurant: [], activity: [], festival: [], museum: [], archaeological_site: [] },
        },
      ]);
    }
  }, [show, dispatch]);

  const entityTypes = ['hotel', 'activity', 'guest_house', 'festival', 'museum', 'archaeological_site', 'restaurant'];
  const optionalEntityTypes = ['restaurant', 'activity', 'festival', 'museum', 'archaeological_site'];

  const fetchEntitiesForDestination = (destinationId) => {
    if (!destinationId) return;
    const id = parseInt(destinationId);
    entityTypes.forEach(type => {
      dispatch(fetchEntities(type, { destination_id: id }))
        .then(data => {
          console.log(`Entities fetched for ${type}:`, data);
          setDestinationEntities(prev => ({
            ...prev,
            [destinationId]: {
              ...(prev[destinationId] || {}),
              [type]: data,
            },
          }));
        })
        .catch(err => {
          console.error(`Failed to fetch entities for ${type}:`, err);
        });
    });
  };

  const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));
    const distance = R * c;
    return Math.min(Math.round(distance * 100) / 100, 9999.99);
  };

  const calculateDistances = (updatedItinerary) => {
    const newItinerary = [...updatedItinerary];
    for (let i = 0; i < newItinerary.length - 1; i++) {
      const fromDest = destinations.find(d => d.id === parseInt(newItinerary[i].destination_id));
      const toDest = destinations.find(d => d.id === parseInt(newItinerary[i + 1].destination_id));
      if (fromDest && toDest) {
        const distance = haversine(fromDest.latitude, fromDest.longitude, toDest.latitude, toDest.longitude);
        newItinerary[i].distance_km = distance;
      } else {
        newItinerary[i].distance_km = 0;
      }
    }
    newItinerary[newItinerary.length - 1].distance_km = 0;
    return newItinerary;
  };

  const addStop = () => {
    const newDay = itinerary.length + 1;
    const newOrder = itinerary.length + 1;
    const newStop = {
      destination_id: '',
      day: newDay - 1,
      order: newOrder - 1,
      distance_km: 0,
      entities: { hotel: '', guest_house: '' },
      optionalEntities: { restaurant: [], activity: [], festival: [], museum: [], archaeological_site: [] },
    };
    const updatedItinerary = [
      itinerary[0],
      ...itinerary.slice(1, -1),
      newStop,
      { ...itinerary[itinerary.length - 1], day: newDay, order: newOrder },
    ];
    setItinerary(calculateDistances(updatedItinerary));
  };

  const updateStop = (index, field, value) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[index][field] = value;

    if (field === 'destination_id') {
      fetchEntitiesForDestination(value);
    }

    updatedItinerary.forEach((stop, i) => {
      stop.day = i + 1;
      stop.order = i + 1;
    });

    setItinerary(calculateDistances(updatedItinerary));
    calculateTotalBudget(updatedItinerary);
  };

  const updateStopEntities = (index, entityType, entityId) => {
    const updatedItinerary = [...itinerary];
    if (entityType === 'hotel' || entityType === 'guest_house') {
      updatedItinerary[index].entities[entityType] = entityId;
      if (entityType === 'hotel' && entityId) {
        updatedItinerary[index].entities.guest_house = '';
      } else if (entityType === 'guest_house' && entityId) {
        updatedItinerary[index].entities.hotel = '';
      }
    }
    setItinerary(updatedItinerary);
    calculateTotalBudget(updatedItinerary);
  };

  const updateOptionalEntities = (index, entityType, selectedOptions) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[index].optionalEntities[entityType] = selectedOptions;
    setItinerary(updatedItinerary);
    calculateTotalBudget(updatedItinerary);
  };

  const calculateTotalBudget = (itinerary) => {
    let total = 0;
    itinerary.forEach(stop => {
      const hotelId = stop.entities.hotel;
      const guestHouseId = stop.entities.guest_house;
      if (hotelId) {
        const entitiesForType = destinationEntities[stop.destination_id]?.hotel || [];
        const entity = entitiesForType.find(e => e.id === parseInt(hotelId));
        if (entity && entity.price) total += parseFloat(entity.price);
      }
      if (guestHouseId) {
        const entitiesForType = destinationEntities[stop.destination_id]?.guest_house || [];
        const entity = entitiesForType.find(e => e.id === parseInt(guestHouseId));
        if (entity && entity.price) total += parseFloat(entity.price);
      }
      Object.entries(stop.optionalEntities).forEach(([entityType, entityIds]) => {
        entityIds.forEach(entityId => {
          if (entityId) {
            const entitiesForType = destinationEntities[stop.destination_id]?.[entityType] || [];
            const entity = entitiesForType.find(e => e.id === parseInt(entityId));
            if (entity && entity.price) total += parseFloat(entity.price);
          }
        });
      });
    });
    setTotalBudget(total);
  };

  const validateForm = () => {
    if (!name) {
      return 'Please fill in the circuit name.';
    }
    if (!departureCity) {
      return 'Please select a departure city.';
    }
    if (!arrivalCity) {
      return 'Please select an arrival city.';
    }
    if (itinerary.length < 2) {
      return 'Please add at least two stops to the itinerary.';
    }
    for (let i = 0; i < itinerary.length; i++) {
      const stop = itinerary[i];
      if (!stop.destination_id) {
        return `Please select a destination for stop ${i + 1}.`;
      }
      const hasHotel = !!stop.entities.hotel;
      const hasGuestHouse = !!stop.entities.guest_house;
      if (!hasHotel && !hasGuestHouse) {
        return `Each stop must have exactly one hotel or guest house selected. Missing for stop ${i + 1}.`;
      }
      if (hasHotel && hasGuestHouse) {
        return `Each stop must have only one of hotel or guest house, not both. Issue at stop ${i + 1}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const circuitData = {
      name,
      description,
      departure_city_id: departureCity,
      arrival_city_id: arrivalCity,
      itinerary: itinerary.map(stop => {
        const entities = { ...stop.entities };
        Object.entries(stop.optionalEntities).forEach(([type, ids]) => {
          if (ids.length > 0) {
            entities[type] = ids[0];
          }
        });
        return {
          destination_id: stop.destination_id,
          day: stop.day,
          order: stop.order,
          distance_km: stop.distance_km,
          entities,
        };
      }),
    };

    try {
      await dispatch(adminCreateCircuit(circuitData));
      alert('Circuit created successfully!');
      onHide();
      window.location.reload();
    } catch (err) {
      setFormError(adminCreateError || 'Failed to create circuit.');
    }
  };

  const handleClose = () => {
    dispatch(clearEntities());
    setDestinationEntities({});
    onHide();
  };

  if (destinationsLoading) {
    return (
      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Circuit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>Loading destinations...</div>
        </Modal.Body>
      </Modal>
    );
  }

  if (destinationsError) {
    return (
      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Circuit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            Failed to load destinations: {destinationsError}
            <Button
              variant="link"
              onClick={() => dispatch(fetchDestinations())}
              className="p-0 ms-2"
            >
              Retry
            </Button>
          </Alert>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un Circuit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        {entitiesError && <Alert variant="danger">{entitiesError}</Alert>}
        {adminCreateLoading && <div>Creating circuit...</div>}
        {adminCreateError && <Alert variant="danger">{adminCreateError}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom du Circuit</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Ville de Départ</Form.Label>
                <Form.Control
                  as="select"
                  value={departureCity}
                  onChange={(e) => {
                    const newDepartureCity = e.target.value;
                    setDepartureCity(newDepartureCity);
                    if (itinerary.length > 0) {
                      const updatedItinerary = [...itinerary];
                      updatedItinerary[0].destination_id = newDepartureCity;
                      setItinerary(calculateDistances(updatedItinerary));
                      fetchEntitiesForDestination(newDepartureCity);
                    }
                  }}
                >
                  <option value="">Sélectionnez une ville</option>
                  {destinations.length > 0 ? (
                    destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>{dest.name}</option>
                    ))
                  ) : (
                    <option disabled>No destinations available</option>
                  )}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Ville d'Arrivée</Form.Label>
                <Form.Control
                  as="select"
                  value={arrivalCity}
                  onChange={(e) => {
                    const newArrivalCity = e.target.value;
                    setArrivalCity(newArrivalCity);
                    if (itinerary.length > 0) {
                      const updatedItinerary = [...itinerary];
                      updatedItinerary[updatedItinerary.length - 1].destination_id = newArrivalCity;
                      setItinerary(calculateDistances(updatedItinerary));
                      fetchEntitiesForDestination(newArrivalCity);
                    }
                  }}
                >
                  <option value="">Sélectionnez une ville</option>
                  {destinations.length > 0 ? (
                    destinations.map(dest => (
                      <option key={dest.id} value={dest.id}>{dest.name}</option>
                    ))
                  ) : (
                    <option disabled>No destinations available</option>
                  )}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <h5>Itinéraire</h5>
          {itinerary.map((stop, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Jour</Form.Label>
                      <Form.Control
                        type="number"
                        value={stop.day}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Destination</Form.Label>
                      <Form.Control
                        as="select"
                        value={stop.destination_id}
                        onChange={(e) => updateStop(index, 'destination_id', e.target.value)}
                        disabled={index === 0 || index === itinerary.length - 1}
                      >
                        <option value="">Sélectionnez une destination</option>
                        {destinations.length > 0 ? (
                          destinations.map(dest => (
                            <option key={dest.id} value={dest.id}>{dest.name}</option>
                          ))
                        ) : (
                          <option disabled>No destinations available</option>
                        )}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Distance (km)</Form.Label>
                      <Form.Control
                        type="number"
                        value={stop.distance_km}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mt-3">Entités Associées</h6>
                {entitiesLoading && <div>Loading entities...</div>}
                {['hotel', 'guest_house'].map(type => {
                  const entitiesForType = destinationEntities[stop.destination_id]?.[type] || [];
                  return (
                    <Form.Group key={type} className="mb-2">
                      <Form.Label>{type.charAt(0).toUpperCase() + type.slice(1)}</Form.Label>
                      <Form.Control
                        as="select"
                        value={stop.entities[type] || ''}
                        onChange={(e) => updateStopEntities(index, type, e.target.value)}
                        disabled={!stop.destination_id}
                      >
                        <option value="">Aucune</option>
                        {entitiesForType.length > 0 ? (
                          entitiesForType.map(entity => (
                            <option key={entity.id} value={entity.id}>
                              {entity.name} ({entity.price || 0} DT)
                            </option>
                          ))
                        ) : (
                          <option disabled>No {type}s available</option>
                        )}
                      </Form.Control>
                    </Form.Group>
                  );
                })}
                {optionalEntityTypes.map(type => {
                  const entitiesForType = destinationEntities[stop.destination_id]?.[type] || [];
                  return (
                    <Form.Group key={type} className="mb-2">
                      <Form.Label>{type.charAt(0).toUpperCase() + type.slice(1)} (Multiple)</Form.Label>
                      <Form.Control
                        as="select"
                        multiple
                        value={stop.optionalEntities[type] || []}
                        onChange={(e) => {
                          const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                          updateOptionalEntities(index, type, selectedOptions);
                        }}
                        disabled={!stop.destination_id}
                      >
                        {entitiesForType.length > 0 ? (
                          entitiesForType.map(entity => (
                            <option key={entity.id} value={entity.id}>
                              {entity.name} ({entity.price || 0} DT)
                            </option>
                          ))
                        ) : (
                          <option disabled>No {type}s available</option>
                        )}
                      </Form.Control>
                    </Form.Group>
                  );
                })}
              </Card.Body>
            </Card>
          ))}

          <Button variant="secondary" onClick={addStop} className="mb-3">
            Ajouter une Étape
          </Button>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Budget Total: {totalBudget} DT</Card.Title>
            </Card.Body>
          </Card>

          <Button variant="primary" type="submit" disabled={adminCreateLoading}>
            Créer le Circuit
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateCircuitForm;