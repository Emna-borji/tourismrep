import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUser, FaLock, FaSignOutAlt, FaHistory } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import './sidebarStyle.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
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
            <FaTachometerAlt className="nav-icon" />
            <span>Tableau de bord</span>
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/account-settings" className={`nav-link ${location.pathname === '/account-settings' && !location.search.includes('tab=history') ? 'active' : ''}`}>
            <FaUser className="nav-icon" />
            <span>Détails du compte</span>
          </Link>
        </Nav.Item>
        
        <Nav.Item>
          <Link to="/change-password" className={`nav-link ${location.pathname === '/change-password' ? 'active' : ''}`}>
            <FaLock className="nav-icon" />
            <span>Changer le mot de passe</span>
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link onClick={handleLogout} className={`nav-link ${location.pathname === '/logout' ? 'active' : ''}`}>
            <FaSignOutAlt className="nav-icon" />
            <span>Déconnexion</span>
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;