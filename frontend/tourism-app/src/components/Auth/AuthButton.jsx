import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const AuthButton = ({ loading, label = 'Submit' }) => {
  return (
    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
      {loading ? <Spinner animation="border" size="sm" /> : label}
    </Button>
  );
};

export default AuthButton;
