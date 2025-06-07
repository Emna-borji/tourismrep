import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Pagination, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CircuitCard from './CircuitCard';
import CreateCircuitForm from './CreateCircuitForm';
import Search from './Shared/Search';
import { fetchCircuits } from '../redux/actions/circuitActions';
import HeroSection from './Shared/HeroSection.jsx';
import './circuitListStyle.css';

// Hero section configuration for circuits
const circuitHeroConfig = {
  image: 'https://static.vecteezy.com/ti/photos-gratuite/p1/9759081-plan-de-voyage-et-de-voyage-tourisme-vacances-maquette-sur-une-table-en-bois-vue-de-dessus-ete-accessoires-et-articles-planification-concept-gratuit-photo.jpg',
  title: 'Découvrez Nos Circuits en Tunisie',
  subtitle: 'Explorez des itinéraires uniques et mémorables',
};

const CircuitList = () => {
  const dispatch = useDispatch();
  const { circuits, loading, error } = useSelector(state => state.circuit);
  const authState = useSelector(state => state.auth);
  console.log('Auth State:', authState);
  const { userInfo } = useSelector(state => state.auth || {});
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('showCreateModal state:', showCreateModal);
  }, [showCreateModal]);

  useEffect(() => {
    dispatch(fetchCircuits(searchQuery));
  }, [dispatch, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const circuitList = Array.isArray(circuits) ? circuits : [];
  const circuitsPerPage = 3;
  const totalPages = Math.ceil(circuitList.length / circuitsPerPage);

  const indexOfLastCircuit = currentPage * circuitsPerPage;
  const indexOfFirstCircuit = indexOfLastCircuit - circuitsPerPage;
  const currentCircuits = circuitList.slice(indexOfFirstCircuit, indexOfLastCircuit);

  const isAdmin = userInfo && userInfo.role === 'admin';
  console.log('userInfo:', userInfo, 'isAdmin:', isAdmin);

  return (
    <>
      <HeroSection
        image={circuitHeroConfig.image}
        title={circuitHeroConfig.title}
        subtitle={circuitHeroConfig.subtitle}
      />
      <Container className="circuit-list-container py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1 className="text-center">Nos Circuits</h1>
          {isAdmin && (
            <Button
              variant="success"
              onClick={() => {
                console.log('Ajouter Circuit button clicked');
                setShowCreateModal(true);
              }}
            >
              Ajouter Circuit
            </Button>
          )}
        </div>

        <Search onSearch={handleSearch} entityType="circuit" className="mb-5" />

        {circuitList.length === 0 ? (
          <div className="text-center">Aucun circuit disponible.</div>
        ) : (
          <>
            <Row>
              {currentCircuits.map(circuit => (
                <Col key={circuit.id} md={12}>
                  <CircuitCard circuit={circuit} />
                </Col>
              ))}
            </Row>
            <div className="pagination-container d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
                <Pagination.Item active>{`page ${currentPage} de ${totalPages}`}</Pagination.Item>
                <Pagination.Next
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </>
        )}

        {showCreateModal && (
          <CreateCircuitForm show={showCreateModal} onHide={() => setShowCreateModal(false)} />
        )}
      </Container>
    </>
  );
};

export default CircuitList;