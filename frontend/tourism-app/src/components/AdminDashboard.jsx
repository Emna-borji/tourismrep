import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Table, Button, Modal, Form, Navbar, Nav, FormControl } from 'react-bootstrap';
import { fetchUsers, blockUser, deleteUser, logout } from '../redux/actions/authActions';
import { FaTrash, FaLock, FaUnlock } from 'react-icons/fa';
import './adminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { users, loading: fetchLoading, error } = useSelector((state) => state.auth);

  // State for modals and view toggle
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState('users'); // 'users' or 'statistics'

  useEffect(() => {
    if (view === 'users') {
      dispatch(fetchUsers());
    }
  }, [dispatch, view]);

  // Determine if a user is currently blocked
  const isUserBlocked = (user) => {
    if (!user || !user.blockstartdate || !user.blockenddate) {
      console.log(`User ${user?.email} is not blocked: blockstartdate=${user?.blockstartdate}, blockenddate=${user?.blockenddate}`);
      return false;
    }

    const now = new Date();
    const startDateStr = user.blockstartdate.includes('T') ? user.blockstartdate : `${user.blockstartdate}T00:00:00Z`;
    const endDateStr = user.blockenddate.includes('T') ? user.blockenddate : `${user.blockenddate}T00:00:00Z`;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log(`User ${user.email} has invalid dates: start=${startDateStr}, end=${endDateStr}`);
      return false;
    }

    const isBlocked = start <= now && now <= end;
    console.log(`User ${user.email} block status: start=${start}, end=${end}, now=${now}, isBlocked=${isBlocked}`);
    return isBlocked;
  };

  // Determine if a user will be blocked in the future
  const willUserBeBlocked = (user) => {
    if (!user || !user.blockstartdate || !user.blockenddate) {
      return false;
    }

    const now = new Date();
    const startDateStr = user.blockstartdate.includes('T') ? user.blockstartdate : `${user.blockstartdate}T00:00:00Z`;
    const start = new Date(startDateStr);

    if (isNaN(start.getTime())) {
      return false;
    }

    const willBeBlocked = start > now;
    console.log(`User ${user.email} will be blocked in the future: start=${start}, now=${now}, willBeBlocked=${willBeBlocked}`);
    return willBeBlocked;
  };

  // Format date for display (e.g., "2025-04-15")
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`);
    return date.toISOString().split('T')[0];
  };

  // Handle block/unblock action
  const handleBlockUser = (user) => {
    setSelectedUser(user);
    setShowBlockModal(true);
    if (!isUserBlocked(user)) {
      if (willUserBeBlocked(user)) {
        setBlockStartDate(user.blockstartdate.split('T')[0]);
        setBlockEndDate(user.blockenddate.split('T')[0]);
      } else {
        setBlockStartDate('');
        setBlockEndDate('');
      }
    }
  };

  const confirmBlockUser = async () => {
    try {
      setActionLoading(true);
      const blockData = isUserBlocked(selectedUser)
        ? { blockstartdate: null, blockenddate: null }
        : { blockstartdate: blockStartDate || null, blockenddate: blockEndDate || null };
      console.log('Confirming block/unblock for user:', selectedUser.id, blockData);
      await dispatch(blockUser(selectedUser.id, blockData));
      console.log('Block/unblock action completed successfully');
      setShowBlockModal(false);
      setBlockStartDate('');
      setBlockEndDate('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete action
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    try {
      setActionLoading(true);
      await dispatch(deleteUser(selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
  };

  // Toggle between views
  const handleViewChange = (newView) => {
    setView(newView);
  };

  if (fetchLoading || actionLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="admin-dashboard"> {/* Add unique wrapper class */}
      {/* Navbar */}
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand>ONTT</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link active={view === 'dashboard'} onClick={() => handleViewChange('dashboard')}>
              Tableau de bord
            </Nav.Link>
            <Nav.Link active={view === 'users'} onClick={() => handleViewChange('users')}>
              Utilisateurs
            </Nav.Link>
            <Nav.Link active={view === 'statistics'} onClick={() => handleViewChange('statistics')}>
              Statistiques
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link>Bonjour, Administrateur</Nav.Link>
            <Nav.Link onClick={handleLogout}>Déconnexion</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {view === 'users' && (
          <>
            <h2 className="dashboard-heading">Tableau de bord des utilisateurs</h2>
            <div className="d-flex justify-content-between mb-3">
              <FormControl
                type="text"
                placeholder="Rechercher"
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Table striped bordered hover key={users.map(u => u.id).join('-')}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de création</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.firstname} {user.lastname}
                      <br />
                      <small>{user.email}</small>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>{user.role}</td>
                    <td>
                      <Button
                        variant={isUserBlocked(user) ? 'warning' : 'success'}
                        size="sm"
                        className="button-with-icon"
                        onClick={() => handleBlockUser(user)}
                        disabled={actionLoading}
                      >
                        <span className="button-content">
                          {isUserBlocked(user) ? <FaUnlock /> : <FaLock />}
                          {isUserBlocked(user) ? ' Débloquer' : ' Bloquer'}
                        </span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        disabled={actionLoading}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {view === 'statistics' && (
          <>
            <h2 className="dashboard-heading">Tableau de bord des statistiques</h2>
            <div style={{ height: '600px', width: '100%' }}>
              <iframe
                title="smart_2 (1)"
                width="1140"
                height="541.25"
                src="https://app.powerbi.com/reportEmbed?reportId=ce99b2f0-b56d-4d67-a13a-7f63e6d1fecd&autoAuth=true&ctid=db257991-9b77-4cc1-9bba-a6ecd882e286"
                frameBorder="0"
                allowFullScreen="true"
              ></iframe>
            </div>
          </>
        )}
      </Container>

      {/* Block/Unblock Modal */}
      {selectedUser && (
        <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{isUserBlocked(selectedUser) ? 'Débloquer l\'utilisateur' : 'Bloquer l\'utilisateur'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isUserBlocked(selectedUser) ? (
              <p>Êtes-vous sûr de vouloir débloquer {selectedUser?.firstname} {selectedUser?.lastname} ?</p>
            ) : (
              <>
                {willUserBeBlocked(selectedUser) ? (
                  <p>
                    Êtes-vous sûr de vouloir modifier la date de blocage pour {selectedUser?.firstname} {selectedUser?.lastname} de{' '}
                    {formatDateForDisplay(selectedUser?.blockstartdate)} à {formatDateForDisplay(selectedUser?.blockenddate)} à{' '}
                    {blockStartDate || 'non défini'} à {blockEndDate || 'non défini'} ?
                  </p>
                ) : (
                  <p>Êtes-vous sûr de vouloir bloquer {selectedUser?.firstname} {selectedUser?.lastname} ?</p>
                )}
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de début de blocage</Form.Label>
                    <Form.Control
                      type="date"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de fin de blocage</Form.Label>
                    <Form.Control
                      type="date"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBlockModal(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button variant="primary" onClick={confirmBlockUser} disabled={actionLoading}>
              {isUserBlocked(selectedUser) ? 'Débloquer' : 'Bloquer'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmer la suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Êtes-vous sûr de vouloir supprimer {selectedUser?.firstname} {selectedUser?.lastname} ?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDeleteUser} disabled={actionLoading}>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;