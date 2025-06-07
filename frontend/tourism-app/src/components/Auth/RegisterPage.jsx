import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import AuthForm from './AuthForm';
import FormInput from './FormInput';
import AuthErrorMessage from './AuthErrorMessage';
import AuthButton from './AuthButton';
import { register } from '../../redux/actions/authActions';
import { fetchDestinations } from '../../redux/actions/destinationActions';
import './registerPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    phonenumber: '+216',
    gender: '',
    dateofbirth: '',
    location_id: '',
    profilepic: '',
    role: 'user',
    password: '',
    is_blocked: false,
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false); // State for success notification

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { destinations, loading: destLoading, error: destinationsError } = useSelector((state) => state.destinations);
  const { loading, error, message, userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDestinations());
  }, [dispatch]);

  useEffect(() => {
    console.log('useEffect triggered - error:', error, 'message:', message, 'userInfo:', userInfo);
    if (error && typeof error === 'object') {
      const normalizedErrors = {};
      for (const [key, value] of Object.entries(error)) {
        normalizedErrors[key] = Array.isArray(value) ? value[0] : value;
      }
      setErrors(normalizedErrors);
      console.log('Normalized errors set:', normalizedErrors);
    } else if (message) {
      setErrors((prev) => {
        const newErrors = { ...prev, email: message };
        console.log('Message set to errors.email:', newErrors);
        return newErrors;
      });
    } else {
      setErrors((prev) => ({ ...prev, email: '' }));
    }

    // Show success notification and redirect on successful registration
    if (userInfo) {
      console.log('User registered successfully');
      setShowSuccess(true); // Show the success notification
      setTimeout(() => {
        setShowSuccess(false); // Hide after 3 seconds
        navigate('/'); // Redirect to login after notification
      }, 3000);
    }
  }, [error, message, userInfo, navigate]);

  const getErrorMessage = (err) => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      const firstKey = Object.keys(err)[0];
      return err[firstKey] instanceof Array ? err[firstKey][0] : err[firstKey];
    }
    return 'Une erreur est survenue.';
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide.';
    }

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!formData.firstname || !nameRegex.test(formData.firstname)) {
      newErrors.firstname = "Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes.";
    }
    if (!formData.lastname || !nameRegex.test(formData.lastname)) {
      newErrors.lastname = "Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes.";
    }

    const phoneRegex = /^\+216\d{8}$/;
    if (!formData.phonenumber || !phoneRegex.test(formData.phonenumber)) {
      newErrors.phonenumber = 'Veuillez entrer 8 chiffres après +216 (ex. : +21612345678).';
    }

    if (!formData.gender || !['male', 'female'].includes(formData.gender)) {
      newErrors.gender = 'Veuillez sélectionner un genre valide.';
    }

    if (!formData.dateofbirth) {
      newErrors.dateofbirth = 'La date de naissance est requise.';
    } else {
      const dob = new Date(formData.dateofbirth);
      const today = new Date('2025-06-03');
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateofbirth = 'Vous devez avoir au moins 18 ans.';
      }
    }

    if (!formData.location_id || !destinations.some(dest => dest.id === parseInt(formData.location_id))) {
      newErrors.location_id = 'Veuillez sélectionner une destination valide.';
    }

    const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
    if (!formData.profilepic || !urlRegex.test(formData.profilepic)) {
      newErrors.profilepic = "Veuillez entrer une URL valide pour la photo de profil.";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    if (name === 'firstname' || name === 'lastname') {
      updatedValue = value.replace(/[0-9]/g, '');
    }

    console.log(`Field changed: ${name}, New value: ${updatedValue}`);
    setFormData(prev => ({
      ...prev,
      [name]: updatedValue,
    }));
    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    if (validateForm()) {
      const submissionData = {
        ...formData,
        location_id: parseInt(formData.location_id),
      };
      const { role, is_blocked, ...dataWithoutReadOnly } = submissionData;
      dispatch(register(dataWithoutReadOnly));
    }
  };

  return (
    <div className="relative">
      {/* Success Notification */}
      {showSuccess && (
        <div
          role="alert"
          className="success-notification bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-green-200 dark:hover:bg-green-800 transform hover:scale-105 animate-fade-out"
        >
          <svg
            stroke="currentColor"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 flex-shrink-0 mr-2 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-xs font-semibold">Inscription réussie !</p>
        </div>
      )}

      <Container className="login-container" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
        <Form className="login-form" onSubmit={handleSubmit}>
          <h2 className="text-center mb-4">Créer votre compte Tunisia Go Travel</h2>
          <Row>
            <Col md={6}>
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                name="email"
                required
                placeholder="Entrez votre email"
              />
              {errors.email && <p className="text-danger text-sm">{errors.email}</p>}

              <FormInput
                label="Prénom"
                value={formData.firstname}
                onChange={handleChange}
                name="firstname"
                required
                placeholder="Entrez votre prénom"
              />
              {errors.firstname && <p className="text-danger text-sm">{errors.firstname}</p>}

              <FormInput
                label="Nom"
                value={formData.lastname}
                onChange={handleChange}
                name="lastname"
                required
                placeholder="Entrez votre nom"
              />
              {errors.lastname && <p className="text-danger text-sm">{errors.lastname}</p>}

              <Form.Group className="mb-3">
                <Form.Label>Numéro de téléphone</Form.Label>
                <div className="d-flex align-items-center">
                  <span className="me-2">+216</span>
                  <Form.Control
                    type="text"
                    value={formData.phonenumber.slice(4)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '');
                      const updatedValue = `+216${digits.slice(0, 8)}`;
                      setFormData(prev => ({
                        ...prev,
                        phonenumber: updatedValue,
                      }));
                      setErrors(prev => ({
                        ...prev,
                        phonenumber: '',
                      }));
                    }}
                    name="phonenumber"
                    required
                    placeholder="12345678"
                  />
                </div>
                {errors.phonenumber && <p className="text-danger text-sm">{errors.phonenumber}</p>}
              </Form.Group>

              <FormInput
                label="URL de la photo de profil"
                value={formData.profilepic}
                onChange={handleChange}
                name="profilepic"
                required
                placeholder="Entrez l'URL de votre photo"
              />
              {errors.profilepic && <p className="text-danger text-sm">{errors.profilepic}</p>}
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Genre</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Sélectionnez...</option>
                  <option value="female">Femme</option>
                  <option value="male">Homme</option>
                </Form.Select>
                {errors.gender && <p className="text-danger text-sm">{errors.gender}</p>}
              </Form.Group>

              <FormInput
                label="Date de naissance"
                type="date"
                value={formData.dateofbirth}
                onChange={handleChange}
                name="dateofbirth"
                required
              />
              {errors.dateofbirth && <p className="text-danger text-sm">{errors.dateofbirth}</p>}

              <Form.Group className="mb-3">
                <Form.Label>Lieu</Form.Label>
                <Form.Select name="location_id" value={formData.location_id} onChange={handleChange} required>
                  <option value="">Sélectionnez une destination</option>
                  {destLoading ? (
                    <option>Chargement...</option>
                  ) : (
                    destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))
                  )}
                </Form.Select>
                {errors.location_id && <p className="text-danger text-sm">{errors.location_id}</p>}
              </Form.Group>

              <FormInput
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={handleChange}
                name="password"
                required
                placeholder="Entrez votre mot de passe"
              />
              {errors.password && <p className="text-danger text-sm">{errors.password}</p>}
            </Col>
          </Row>
          <AuthErrorMessage message={getErrorMessage(error) || getErrorMessage(destinationsError)} />
          <AuthButton loading={loading} label="S'inscrire" />
          <p className="text-center">
            Déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </Form>
      </Container>
    </div>
  );
};

export default RegisterPage;