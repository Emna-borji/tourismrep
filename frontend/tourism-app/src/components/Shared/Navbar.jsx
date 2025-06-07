import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Dropdown } from 'react-bootstrap';
import { FaHome, FaUtensils, FaMapSigns, FaLandmark, FaFeatherAlt, FaBus, FaUser, FaDoorOpen } from 'react-icons/fa';
import './navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth || {});

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    dispatch(logout());
    navigate('/login');
  };

  return (
    <BootstrapNavbar expand="lg" className="custom-navbar">
      <Nav className="mx-auto">
        <Nav.Link as={Link} to="/" className="nav-link-custom">
          <FaDoorOpen className="nav-icon" />
          <span>Accueil</span>
        </Nav.Link>
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaHome className="nav-icon" />
            <span>Hébergement</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/hotels" className="dropdown-item-custom">Hôtels</Dropdown.Item>
            <Dropdown.Item as={Link} to="/guest_houses" className="dropdown-item-custom">Maison d'hôtes</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Nav.Link as={Link} to="/restaurants" className="nav-link-custom">
          <FaUtensils className="nav-icon" />
          <span>Restaurants</span>
        </Nav.Link>
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaMapSigns className="nav-icon" />
            <span>Circuit</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/circuit-wizard" className="dropdown-item-custom">Circuit personnalisé</Dropdown.Item>
            <Dropdown.Item as={Link} to="/predefined-circuits" className="dropdown-item-custom">Circuit prédéfini</Dropdown.Item>
            <Dropdown.Item as={Link} to="/tourist-guides" className="dropdown-item-custom">Guide touristique</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaLandmark className="nav-icon" />
            <span>Culture</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/museums" className="dropdown-item-custom">Musées</Dropdown.Item>
            <Dropdown.Item as={Link} to="/archaeological_sites" className="dropdown-item-custom">Sites archéologiques</Dropdown.Item>
            <Dropdown.Item as={Link} to="/festivals" className="dropdown-item-custom">Festival</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Nav.Link as={Link} to="/activities" className="nav-link-custom">
          <FaFeatherAlt className="nav-icon" />
          <span>Activités</span>
        </Nav.Link>
        {userInfo ? (
          <Dropdown
            onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
            onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          >
            <Dropdown.Toggle as={Nav.Link} className="nav-link-custom profile-toggle">
              <FaUser className="profile-icon" />
              <span className="profile-text">{userInfo.firstname || 'Utilisateur'}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-custom profile-dropdown">
              <Dropdown.Item className="dropdown-item-custom profile-name">
                {userInfo.firstname || 'Utilisateur'}
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/account-settings" className="dropdown-item-custom">Profil</Dropdown.Item>
              <Dropdown.Item as={Link} to="/admin" className="dropdown-item-custom">Gestion des utilisateurs</Dropdown.Item>
              <Dropdown.Item onClick={handleLogout} className="dropdown-item-custom">Se déconnecter</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ) : (
          <Nav.Link as={Link} to="/login" className="nav-link-custom login-link">
            <span>Se connecter</span>
          </Nav.Link>
        )}
      </Nav>
    </BootstrapNavbar>
  );
};

export default Navbar;