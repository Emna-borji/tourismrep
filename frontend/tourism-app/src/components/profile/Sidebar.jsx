import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUser, FaLock, FaSignOutAlt } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions'; // Updated import
import './sidebarStyle.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth); // Updated to use state.auth.userInfo
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img
          src={userInfo?.profilepic || 'https://via.placeholder.com/100'}
          alt="Profil"
          className="sidebar-profile-img"
        />
      </div>
      <Nav className="flex-column">
        <Nav.Item>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <FaTachometerAlt className="nav-icon" /> Tableau de bord
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/account-settings" className={`nav-link ${location.pathname === '/account-settings' ? 'active' : ''}`}>
            <FaUser className="nav-icon" /> Détails du compte
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/change-password" className={`nav-link ${location.pathname === '/change-password' ? 'active' : ''}`}>
            <FaLock className="nav-icon" /> Changer le mot de passe
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link onClick={handleLogout} className={`nav-link ${location.pathname === '/logout' ? 'active' : ''}`}>
            <FaSignOutAlt className="nav-icon" /> Déconnexion
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;