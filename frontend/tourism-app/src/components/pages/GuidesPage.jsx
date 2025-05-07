import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner, Pagination } from 'react-bootstrap';
import { FaPhoneAlt } from 'react-icons/fa';
import { fetchGuides, createGuide, updateGuide, deleteGuide } from '../../redux/actions/guideActions';
import './guidesPage.css';

const GuidesPage = () => {
  const dispatch = useDispatch();
  const guidesState = useSelector((state) => state.guides || { guides: [], loading: false, error: null });
  const { guides, loading, error } = guidesState;
  const { userInfo } = useSelector((state) => state.auth);

  const [currentPage, setCurrentPage] = useState(1);
  const guidesPerPage = 12;
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [formData, setFormData] = useState({
    num_gd: '',
    descatl: '',
    nom_gui: '',
    pre_guide: '',
    sexe: '',
    adresse: '',
    tel: '',
    dat_deb_activ: '',
  });

  useEffect(() => {
    dispatch(fetchGuides());
  }, [dispatch]);

  // Calculate pagination
  const indexOfLastGuide = currentPage * guidesPerPage;
  const indexOfFirstGuide = indexOfLastGuide - guidesPerPage;
  const currentGuides = guides.slice(indexOfFirstGuide, indexOfLastGuide);
  const totalPages = Math.ceil(guides.length / guidesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleShowModal = (guide = null) => {
    if (guide) {
      setIsEditMode(true);
      setCurrentGuide(guide);
      setFormData({
        num_gd: guide.num_gd || '',
        descatl: guide.descatl || '',
        nom_gui: guide.nom_gui || '',
        pre_guide: guide.pre_guide || '',
        sexe: guide.sexe || '',
        adresse: guide.adresse || '',
        tel: guide.tel || '',
        dat_deb_activ: guide.dat_deb_activ || '',
      });
    } else {
      setIsEditMode(false);
      setCurrentGuide(null);
      setFormData({
        num_gd: '',
        descatl: '',
        nom_gui: '',
        pre_guide: '',
        sexe: '',
        adresse: '',
        tel: '',
        dat_deb_activ: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode && currentGuide) {
      dispatch(updateGuide(currentGuide.id, formData)).then(() => {
        handleCloseModal();
      });
    } else {
      dispatch(createGuide(formData)).then(() => {
        handleCloseModal();
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce guide ?')) {
      dispatch(deleteGuide(id));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger">Erreur: {error}</p>;
  }

  return (
    <Container className="guides-page">
      <div className="d-flex justify-content-between align-items-center mt-5 mb-4">
        <h1 className="page-title">GUIDES TOURISTIQUES</h1>
        {userInfo && userInfo.role === 'admin' && (
          <Button
            variant="success"
            onClick={() => handleShowModal()}
            className="add-guide-btn"
          >
            Ajouter un guide
          </Button>
        )}
      </div>
      <p className="page-subtitle">page d'accueil | Guide touristique</p>

      <Row>
        {currentGuides.map((guide) => (
          <Col md={4} key={guide.id} className="mb-4">
            <Card className="guide-card">
              <Card.Body className="d-flex flex-column">
                <div className="guide-image-placeholder">
                  <img
                    src="https://via.placeholder.com/100"
                    alt={`${guide.pre_guide} ${guide.nom_gui}`}
                    className="guide-image"
                  />
                </div>
                <div className="guide-info">
                  <Card.Title className="guide-name">
                    {guide.pre_guide} {guide.nom_gui}
                  </Card.Title>
                  {guide.descatl && (
                    <Card.Text className="guide-description">{guide.descatl}</Card.Text>
                  )}
                  {guide.adresse && (
                    <Card.Text className="guide-address">
                      <strong>Adresse:</strong> {guide.adresse}
                    </Card.Text>
                  )}
                  {guide.tel && (
                    <Card.Text className="guide-phone">
                      <FaPhoneAlt className="me-2" />
                      {guide.tel}
                    </Card.Text>
                  )}
                  {userInfo && userInfo.role === 'admin' && (
                    <div className="guide-actions">
                      <Button
                        variant="primary"
                        onClick={() => handleShowModal(guide)}
                        className="me-2"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(guide.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages).keys()].map((page) => (
              <Pagination.Item
                key={page + 1}
                active={page + 1 === currentPage}
                onClick={() => handlePageChange(page + 1)}
              >
                {page + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
          <span className="ms-3 pagination-info">page {currentPage} de {totalPages}</span>
        </div>
      )}

      {/* Modal for Add/Edit Guide */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Modifier le guide' : 'Ajouter un guide'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Numéro du guide</Form.Label>
              <Form.Control
                type="text"
                name="num_gd"
                value={formData.num_gd}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="descatl"
                value={formData.descatl}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                name="nom_gui"
                value={formData.nom_gui}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prénom</Form.Label>
              <Form.Control
                type="text"
                name="pre_guide"
                value={formData.pre_guide}
                onChange={handleInputChange}
                // Removed required attribute to make this field optional
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sexe</Form.Label>
              <Form.Select
                name="sexe"
                value={formData.sexe}
                onChange={handleInputChange}
              >
                <option value="">Sélectionnez le sexe</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                as="textarea"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control
                type="text"
                name="tel"
                value={formData.tel}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date de début d'activité</Form.Label>
              <Form.Control
                type="date"
                name="dat_deb_activ"
                value={formData.dat_deb_activ}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              {isEditMode ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default GuidesPage;