import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const NotFound: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '72px', color: 'var(--primary-color)', marginBottom: '0' }}>404</h1>
      <h2 style={{ marginBottom: '20px' }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button>Go Back Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;