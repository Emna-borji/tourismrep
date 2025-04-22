import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form } from 'react-bootstrap';

import AuthForm from './AuthForm';
import FormInput from './FormInput';
import AuthErrorMessage from './AuthErrorMessage';
import AuthButton from './AuthButton';

import { register } from '../../redux/actions/authActions';
import { fetchDestinations } from '../../redux/actions/destinationActions';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    phonenumber: '',
    gender: '',
    dateofbirth: '',
    location_id: '',
    profilepic: '',
    role: 'user',
    password: '',
    is_blocked: false,
  });

  const dispatch = useDispatch();
  const { destinations, loading: destLoading, error: destinationsError } = useSelector((state) => state.destinations);
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDestinations());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(formData));
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <AuthForm onSubmit={handleSubmit} loading={loading} title="Create Your Tunisia Go Travel Account">
            <Row>
              <Col md={6}>
                <FormInput label="Email" type="email" value={formData.email} onChange={(e) => handleChange(e)} name="email" required />
                <FormInput label="First Name" value={formData.firstname} onChange={(e) => handleChange(e)} name="firstname" required />
                <FormInput label="Last Name" value={formData.lastname} onChange={(e) => handleChange(e)} name="lastname" required />
                <FormInput label="Phone Number" value={formData.phonenumber} onChange={(e) => handleChange(e)} name="phonenumber" required />
                <FormInput label="Profile Picture URL" value={formData.profilepic} onChange={(e) => handleChange(e)} name="profilepic" required />
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </Form.Select>
                </Form.Group>

                <FormInput label="Date of Birth" type="date" value={formData.dateofbirth} onChange={(e) => handleChange(e)} name="dateofbirth" required />

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Select name="location_id" value={formData.location_id} onChange={handleChange} required>
                    <option value="">Select a destination</option>
                    {destLoading ? (
                      <option>Loading...</option>
                    ) : (
                      destinations.map((destination) => (
                        <option key={destination.id} value={destination.id}>
                          {destination.name}
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>

                <FormInput label="Password" type="password" value={formData.password} onChange={(e) => handleChange(e)} name="password" required />
              </Col>
            </Row>

            <AuthErrorMessage message={error || destinationsError} />
            <AuthButton loading={loading} label="Register" />
          </AuthForm>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
