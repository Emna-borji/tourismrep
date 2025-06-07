import React from 'react';
import { Form } from 'react-bootstrap';

const FormInput = ({ label, type = 'text', value, onChange, required = false, ...rest }) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        {...rest} // Pass all other props like name, placeholder, etc.
      />
    </Form.Group>
  );
};

export default FormInput;