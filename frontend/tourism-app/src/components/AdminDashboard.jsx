import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Table, Button, Modal, Form, Navbar, Nav, FormControl } from 'react-bootstrap';
import { fetchUsers, blockUser, deleteUser, logout } from '../redux/actions/authActions';
import { FaTrash, FaLock, FaUnlock } from 'react-icons/fa';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { users, loading: fetchLoading, error } = useSelector((state) => state.auth);

  // State for modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

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
    // Prefill dates if the user is not currently blocked but has a future block, or if we're setting new block dates
    if (!isUserBlocked(user)) {
      if (willUserBeBlocked(user)) {
        // Prefill with existing future block dates
        setBlockStartDate(user.blockstartdate.split('T')[0]);
        setBlockEndDate(user.blockenddate.split('T')[0]);
      } else {
        // No block dates, start fresh
        setBlockStartDate('');
        setBlockEndDate('');
      }
    }
  };

  const confirmBlockUser = async () => {
    try {
      setActionLoading(true);
      const blockData = isUserBlocked(selectedUser)
        ? { blockstartdate: null, blockenddate: null } // Unblock case
        : { blockstartdate: blockStartDate || null, blockenddate: blockEndDate || null }; // Block case
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

  if (fetchLoading || actionLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Navbar */}
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand>ONTT</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link>Dashboard</Nav.Link>
            <Nav.Link active>Users</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link>Hello, Admin</Nav.Link>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <h2>Users Dashboard</h2>
        <div className="d-flex justify-content-between mb-3">
          <FormControl
            type="text"
            placeholder="Search"
            style={{ width: '200px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div>
            <Button variant="outline-primary" className="me-2">
              Sort by
            </Button>
            <Button variant="outline-secondary">Saved search</Button>
          </div>
        </div>

        <h4>List Users</h4>
        <Table striped bordered hover key={users.map(u => u.id).join('-')}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Create Date</th>
              <th>Role</th>
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
                    className="me-2"
                    onClick={() => handleBlockUser(user)}
                    disabled={actionLoading}
                  >
                    {isUserBlocked(user) ? <FaUnlock /> : <FaLock />}
                    {isUserBlocked(user) ? ' Unblock' : ' Block'}
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
      </Container>

      {/* Block/Unblock Modal */}
      {selectedUser && (
        <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{isUserBlocked(selectedUser) ? 'Unblock User' : 'Block User'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isUserBlocked(selectedUser) ? (
              <p>Are you sure you want to unblock {selectedUser?.firstname} {selectedUser?.lastname}?</p>
            ) : (
              <>
                {willUserBeBlocked(selectedUser) ? (
                  <p>
                    Are you sure you want to change the blocking date for {selectedUser?.firstname} {selectedUser?.lastname} from{' '}
                    {formatDateForDisplay(selectedUser?.blockstartdate)} to {formatDateForDisplay(selectedUser?.blockenddate)} to{' '}
                    {blockStartDate || 'not set'} to {blockEndDate || 'not set'}?
                  </p>
                ) : (
                  <p>Are you sure you want to block {selectedUser?.firstname} {selectedUser?.lastname}?</p>
                )}
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Block Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Block End Date</Form.Label>
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
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmBlockUser} disabled={actionLoading}>
              {isUserBlocked(selectedUser) ? 'Unblock' : 'Block'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete {selectedUser?.firstname} {selectedUser?.lastname}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteUser} disabled={actionLoading}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;