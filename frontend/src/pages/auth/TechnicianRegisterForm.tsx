import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { DocumentType } from '../../types/auth.types';
import { FaCloudUploadAlt, FaCheck, FaArrowLeft } from 'react-icons/fa';
import '../../styles/auth.css';

type Step = 1 | 2;

interface TechnicianFormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2: KYC
  documentType: DocumentType;
  documentNumber: string;
  documentFront: File | null;
  documentBack: File | null;
  selfie: File | null;
}

const TechnicianRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { registerTechnician, isLoading, error, clearError } = useAuth();
  
  const [step, setStep] = useState<Step>(1);
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const [formData, setFormData] = useState<TechnicianFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    documentType: 'CITIZENSHIP',
    documentNumber: '',
    documentFront: null,
    documentBack: null,
    selfie: null,
  });

  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const validateStep1 = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setValidationError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setValidationError('Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      setValidationError('Please enter your phone number');
      return false;
    }
    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.documentNumber.trim()) {
      setValidationError('Please enter your document number');
      return false;
    }
    if (!formData.documentFront) {
      setValidationError('Please upload the front of your document');
      return false;
    }
    if (!formData.documentBack) {
      setValidationError('Please upload the back of your document');
      return false;
    }
    if (!formData.selfie) {
      setValidationError('Please upload a selfie with your document');
      return false;
    }
    if (!agreed) {
      setValidationError('Please accept terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setValidationError('');
    clearError();
    
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setValidationError('');
    setStep(1);
  };

  const handleFileChange = (field: 'documentFront' | 'documentBack' | 'selfie', file: File | null) => {
    setFormData({ ...formData, [field]: file });
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!validateStep2()) return;

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', `${formData.firstName} ${formData.lastName}`.trim());
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('password', formData.password);
      submitData.append('role', 'TECHNICIAN');
      submitData.append('documentType', formData.documentType);
      submitData.append('documentNumber', formData.documentNumber);
      
      if (formData.documentFront) {
        submitData.append('documentFront', formData.documentFront);
      }
      if (formData.documentBack) {
        submitData.append('documentBack', formData.documentBack);
      }
      if (formData.selfie) {
        submitData.append('selfie', formData.selfie);
      }

      await registerTechnician(submitData);
      navigate('/auth/otp-verify');
    } catch {
      // Error handled by context
    }
  };

  const displayError = validationError || error;

  const FileUploadBox: React.FC<{
    label: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (file: File | null) => void;
    accept?: string;
  }> = ({ label, file, inputRef, onChange, accept = 'image/*' }) => (
    <div className="file-upload-wrapper">
      <label className="file-upload-label">{label}</label>
      <div 
        className={`file-upload-box ${file ? 'has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="file-upload-success">
            <FaCheck size={24} color="var(--primary-color)" />
            <span>{file.name}</span>
          </div>
        ) : (
          <div className="file-upload-placeholder">
            <FaCloudUploadAlt size={32} color="#999" />
            <span>Click to upload</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="auth-form-container">
      {/* Progress indicator */}
      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Basic Info</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">KYC Documents</span>
        </div>
      </div>

      <h2 className="auth-title">
        {step === 1 ? 'Create Your Technician Account' : 'Verify Your Identity'}
      </h2>
      
      {step === 2 && (
        <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
          Upload your documents for verification. This helps us ensure trust and safety.
        </p>
      )}

      {displayError && (
        <div className="error-message" style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Input 
                label="First Name" 
                placeholder="Enter your first name" 
                wrapperStyle={{ flex: 1 }}
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <Input 
                label="Last Name" 
                placeholder="Enter your last name" 
                wrapperStyle={{ flex: 1 }}
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>

            <Input 
              label="Email" 
              type="email" 
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />

            <Input 
              label="Phone Number" 
              type="tel" 
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />

            <Input 
              label="Password" 
              type="password" 
              placeholder="Enter your password (min 8 characters)"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />

            <Input 
              label="Confirm Password" 
              type="password" 
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />

            <Button type="button" onClick={handleNext} style={{ width: '120px' }}>
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-group">
              <label className="input-label">Document Type</label>
              <select
                className="custom-select"
                value={formData.documentType}
                onChange={(e) => setFormData({...formData, documentType: e.target.value as DocumentType})}
              >
                <option value="CITIZENSHIP">Citizenship</option>
                <option value="LICENSE">License</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>

            <Input 
              label="Document Number" 
              placeholder="Enter your document number"
              value={formData.documentNumber}
              onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
              required
            />

            <div className="file-uploads-grid">
              <FileUploadBox
                label="Document Front"
                file={formData.documentFront}
                inputRef={frontInputRef}
                onChange={(file) => handleFileChange('documentFront', file)}
              />
              <FileUploadBox
                label="Document Back"
                file={formData.documentBack}
                inputRef={backInputRef}
                onChange={(file) => handleFileChange('documentBack', file)}
              />
            </div>

            <FileUploadBox
              label="Selfie with Document"
              file={formData.selfie}
              inputRef={selfieInputRef}
              onChange={(file) => handleFileChange('selfie', file)}
            />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', marginTop: '16px' }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', marginRight: '8px' }}
              />
              <label htmlFor="terms" style={{ fontSize: '14px', color: '#333' }}>
                I accept the <span style={{ color: 'var(--primary-color)' }}>Terms and Conditions</span> & <span style={{ color: 'var(--primary-color)' }}>Privacy Policy</span>.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                style={{ minWidth: '100px' }}
              >
                <FaArrowLeft style={{ marginRight: '8px' }} /> Back
              </Button>
              <Button type="submit" isLoading={isLoading} style={{ minWidth: '120px' }}>
                Register
              </Button>
            </div>
          </>
        )}

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <Link to="/auth/login" style={{ color: 'var(--primary-color)' }}>Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default TechnicianRegisterForm;
