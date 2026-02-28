import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { API_ENDPOINTS, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';
import '../../styles/auth.css';

type DocumentType = 'CITIZENSHIP' | 'LICENSE' | 'PASSPORT';

interface UploadedFile {
  file: File | null;
  preview: string;
  url: string;
  uploading: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CITIZENSHIP: 'Citizenship',
  LICENSE: 'License',
  PASSPORT: 'Passport',
};

const TechnicianKycUpload: React.FC = () => {
  const navigate = useNavigate();

  const [documentType, setDocumentType] = useState<DocumentType>('CITIZENSHIP');
  const [documentNumber, setDocumentNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [documentFront, setDocumentFront] = useState<UploadedFile>({
    file: null, preview: '', url: '', uploading: false,
  });
  const [documentBack, setDocumentBack] = useState<UploadedFile>({
    file: null, preview: '', url: '', uploading: false,
  });
  const [selfie, setSelfie] = useState<UploadedFile>({
    file: null, preview: '', url: '', uploading: false,
  });

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are accepted';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const uploadFile = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<UploadedFile>>,
  ) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const preview = URL.createObjectURL(file);
    setter({ file, preview, url: '', uploading: true });
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(API_ENDPOINTS.UPLOAD.IMAGE, formData);

      const url = response.data.data.url as string;
      setter((prev) => ({ ...prev, url, uploading: false }));
    } catch {
      setter({ file: null, preview: '', url: '', uploading: false });
      setError('Failed to upload image. Please try again.');
      toast.error('Failed to upload image. Please try again.');
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadedFile>>,
  ) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, setter);
  };

  const handleDrop = (
    e: React.DragEvent,
    setter: React.Dispatch<React.SetStateAction<UploadedFile>>,
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file, setter);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isUploading = documentFront.uploading || documentBack.uploading || selfie.uploading;
  const allUploaded = documentFront.url && documentBack.url && selfie.url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!documentNumber.trim()) {
      setError('Please enter your document number');
      toast.error('Please enter your document number');
      return;
    }
    if (!allUploaded) {
      setError('Please upload all required documents');
      toast.error('Please upload all required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.KYC.SUBMIT, {
        documentType,
        documentNumber: documentNumber.trim(),
        documentFront: documentFront.url,
        documentBack: documentBack.url,
        selfie: selfie.url,
      });

      setSuccess(true);
      toast.success('KYC documents submitted successfully!');
      setTimeout(() => navigate('/technician/dashboard'), 3000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to submit KYC. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUploadBox = (
    label: string,
    state: UploadedFile,
    setter: React.Dispatch<React.SetStateAction<UploadedFile>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => (
    <div className="file-upload-wrapper">
      <label className="input-label">{label}</label>
      <div
        className="file-upload-box"
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => handleDrop(e, setter)}
        onDragOver={handleDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, setter)}
        />
        {state.uploading ? (
          <div className="file-upload-placeholder">
            <span style={{ fontSize: '24px' }}>⏳</span>
            <p>Uploading...</p>
          </div>
        ) : state.url ? (
          <div className="file-upload-success">
            <img
              src={state.preview}
              alt={label}
              style={{
                maxWidth: '100%',
                maxHeight: '120px',
                borderRadius: '8px',
                objectFit: 'cover',
              }}
            />
            <p style={{ color: '#16a34a', marginTop: '4px', fontSize: '12px' }}>
              ✓ Uploaded
            </p>
          </div>
        ) : (
          <div className="file-upload-placeholder">
            <span style={{ fontSize: '24px' }}>📁</span>
            <p>Click or drag to upload</p>
            <span style={{ fontSize: '12px', color: '#999' }}>
              JPEG, PNG or WebP (max 5MB)
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="auth-form-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <span style={{ fontSize: '48px' }}>✅</span>
          <h2 className="auth-title" style={{ marginTop: '16px' }}>
            KYC Submitted Successfully!
          </h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Your documents are under review. We'll notify you once verified.
          </p>
          <p style={{ color: '#999', marginTop: '16px', fontSize: '14px' }}>
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="step-indicator">
        <div className="step completed">
          <span className="step-number">✓</span>
          <span className="step-label">Account</span>
        </div>
        <div className="step-line"></div>
        <div className="step completed">
          <span className="step-number">✓</span>
          <span className="step-label">Verify OTP</span>
        </div>
        <div className="step-line"></div>
        <div className="step active">
          <span className="step-number">3</span>
          <span className="step-label">Upload KYC</span>
        </div>
      </div>

      <h2 className="auth-title">Upload KYC Documents</h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Upload your identity documents for verification. This is required before you can start accepting jobs.
      </p>

      {error && (
        <div
          className="error-message"
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">Document Type</label>
          <select
            className="custom-select"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Document Number"
          type="text"
          placeholder="Enter your document number"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          required
        />

        <div className="file-uploads-grid">
          {renderUploadBox('Document Front', documentFront, setDocumentFront, frontRef)}
          {renderUploadBox('Document Back', documentBack, setDocumentBack, backRef)}
        </div>

        <div style={{ marginTop: '16px' }}>
          {renderUploadBox('Selfie with Document', selfie, setSelfie, selfieRef)}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting || isUploading || !allUploaded}
          style={{ marginTop: '24px' }}
        >
          Submit KYC
        </Button>
      </form>
    </div>
  );
};

export default TechnicianKycUpload;
