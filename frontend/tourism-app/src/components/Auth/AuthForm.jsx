import React from 'react';
import { Form, Button, Card } from 'react-bootstrap';

const AuthForm = ({ children, onSubmit, loading, title = '' }) => {
  return (
    <Card className="shadow p-4 bg-light rounded">
      <Card.Body>
        <h2 className="text-center mb-4">{title}</h2>
        <Form onSubmit={onSubmit}>
          {children}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AuthForm;
