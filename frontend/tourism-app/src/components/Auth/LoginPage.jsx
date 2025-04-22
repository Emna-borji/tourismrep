import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';
import AuthForm from './AuthForm';
import FormInput from './FormInput';
import AuthButton from './AuthButton';
import AuthErrorMessage from './AuthErrorMessage';
import { login } from '../../redux/actions/authActions';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <AuthForm onSubmit={handleSubmit} loading={loading} title="Login to Tunisia Go Travel">
            <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <FormInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <AuthErrorMessage message={error} />
            <AuthButton loading={loading} label="Login" />
          </AuthForm>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
