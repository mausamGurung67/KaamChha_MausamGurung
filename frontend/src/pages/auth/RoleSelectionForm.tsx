import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { FaLaptopCode, FaWalking } from 'react-icons/fa'; // Icons similar to design
import '../../styles/auth.css';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'technician' | null>(null);

  const handleContinue = () => {
    if (selectedRole === 'customer') {
      navigate('/auth/register', { state: { role: selectedRole } });
    } else if (selectedRole === 'technician') {
      navigate('/auth/register-technician');
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title" style={{ fontSize: '24px', marginBottom: '40px' }}>
        How do you want to use Kaam Chha?
      </h2>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        
        {/* Customer Card */}
        <div 
          onClick={() => setSelectedRole('customer')}
          className={`role-card ${selectedRole === 'customer' ? 'active' : ''}`}
        >
          <div className="role-radio">
            {selectedRole === 'customer' && <div className="role-radio-inner" />}
          </div>
          <FaLaptopCode size={40} style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>I need Service</h3>
          
          {selectedRole === 'customer' && (
            <Button 
              className="role-btn" 
              onClick={(e) => { e.stopPropagation(); handleContinue(); }}
            >
              Continue as a Customer
            </Button>
          )}
        </div>

        {/* Technician Card */}
        <div 
          onClick={() => setSelectedRole('technician')}
          className={`role-card ${selectedRole === 'technician' ? 'active' : ''}`}
        >
          <div className="role-radio">
             {selectedRole === 'technician' && <div className="role-radio-inner" />}
          </div>
          <FaWalking size={40} style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>I want to Work</h3>

          {selectedRole === 'technician' && (
             <Button 
               className="role-btn" 
               onClick={(e) => { e.stopPropagation(); handleContinue(); }}
             >
               Continue as a Technician
             </Button>
           )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <span style={{ color: '#666' }}>OR</span>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Already have an account? <Link to="/auth/login" style={{ color: 'var(--primary-color)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;