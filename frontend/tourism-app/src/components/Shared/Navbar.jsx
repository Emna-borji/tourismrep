import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Dropdown } from 'react-bootstrap';
import { FaHome, FaUtensils, FaMapSigns, FaLandmark, FaFeatherAlt, FaBriefcaseMedical, FaBus, FaHammer, FaBars, FaUser } from 'react-icons/fa';
import './navbar.css';
import { Link } from 'react-router-dom';


const Navbar = () => {
  return (
    <BootstrapNavbar expand="lg" className="custom-navbar">
      <Nav className="mx-auto">
        {/* Hébergement Dropdown */}
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaHome className="nav-icon" /> Hébergement
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/hotels" className="dropdown-item-custom">Hôtels</Dropdown.Item>
            <Dropdown.Item as={Link} to="/guest_houses" className="dropdown-item-custom">Maison d'hôtes</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Restaurants */}
        <Nav.Link className="nav-link-custom">
          <FaUtensils className="nav-icon" /> Restaurants
        </Nav.Link>

        {/* Circuit Dropdown */}
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaMapSigns className="nav-icon" /> Circuit
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/circuit-wizard" className="dropdown-item-custom">circuit personnalisé</Dropdown.Item>
            <Dropdown.Item className="dropdown-item-custom">circuit prédéfini</Dropdown.Item>
            <Dropdown.Item className="dropdown-item-custom">guide touristique</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Culture Dropdown */}
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom">
            <FaLandmark className="nav-icon" /> Culture
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom">
            <Dropdown.Item as={Link} to="/museums" className="dropdown-item-custom">Musées</Dropdown.Item>
            <Dropdown.Item as={Link} to="/archaeological_sites" className="dropdown-item-custom">sites archéologiques</Dropdown.Item>
            <Dropdown.Item as={Link} to="/festivals" className="dropdown-item-custom">Festival</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Activités */}
        <Nav.Link className="nav-link-custom">
          <FaFeatherAlt as={Link} to="/activities" className="nav-icon" /> Activités
        </Nav.Link>

        {/* Séjour médical */}
        {/* <Nav.Link className="nav-link-custom">
          <FaBriefcaseMedical className="nav-icon" /> Séjour médical
        </Nav.Link> */}

        {/* Transports */}
        <Nav.Link className="nav-link-custom">
          <FaBus className="nav-icon" /> Transports
        </Nav.Link>

        {/* Artisanat */}
        {/* <Nav.Link className="nav-link-custom">
          <FaHammer className="nav-icon" /> Artisanat
        </Nav.Link> */}

        {/* Annuaire */}
        {/* <Nav.Link className="nav-link-custom">
          <FaBars className="nav-icon" /> Annuaire
        </Nav.Link> */}

        {/* Profile Dropdown */}
        <Dropdown
          onMouseEnter={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
          onMouseLeave={(e) => e.currentTarget.querySelector('.dropdown-toggle').click()}
        >
          <Dropdown.Toggle as={Nav.Link} className="nav-link-custom profile-toggle">
            <FaUser className="profile-icon" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-custom profile-dropdown">
            <Dropdown.Item className="dropdown-item-custom profile-name">boriji</Dropdown.Item>
            <Dropdown.Item as={Link} to="/account-settings" className="dropdown-item-custom">Profil</Dropdown.Item>
            <Dropdown.Item className="dropdown-item-custom">Se déconnecter</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    </BootstrapNavbar>
  );
};

export default Navbar;