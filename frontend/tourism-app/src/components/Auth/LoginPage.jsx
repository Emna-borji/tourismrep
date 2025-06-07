import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/actions/authActions';
import './loginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false); // Success notification state
  const [showError, setShowError] = useState(false); // Error notification state
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, userInfo } = useSelector((state) => state.auth);

  // Handle success notification and redirect
  useEffect(() => {
    if (userInfo) {
      console.log('User logged in successfully - setting showSuccess to true');
      setShowSuccess(true);
      setTimeout(() => {
        console.log('Hiding success notification and redirecting to /');
        setShowSuccess(false);
        navigate('/');
      }, 3000);
    }
  }, [userInfo, navigate]);

  // Handle error notification
  useEffect(() => {
    if (error) {
      console.log('Login failed - setting showError to true', error);
      setShowError(true);
      setTimeout(() => {
        console.log('Hiding error notification');
        setShowError(false);
      }, 3000);
    }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password })); // No need to await or catch
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
          <p className="text-xs font-semibold">Connexion réussie !</p>
        </div>
      )}

      {/* Error Notification */}
      {showError && error && (
        <div
          role="alert"
          className="error-notification bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105 animate-fade-out"
          style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: '9999', width: '250px' }}
        >
          <svg
            stroke="currentColor"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 flex-shrink-0 mr-2 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-xs font-semibold">Erreur - {error}</p>
        </div>
      )}

      <Container className="login-container" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
        <Form className="login-form" onSubmit={handleSubmit}>
          <h2 className="text-center mb-4">Connexion</h2>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Connexion en cours...
              </>
            ) : 'Se connecter'}
          </Button>
          <p className="text-center">
            Pas de compte ? <a href="/register">Inscrivez-vous</a>
          </p>
        </Form>
      </Container>
    </div>
  );
};

export default LoginPage;