// ─── Reusable Validation Utilities ───

export interface FieldErrors {
  [field: string]: string;
}

// Phone: exactly 10 digits (Nepal mobile numbers)
export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Phone number is required';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone number must be 10 digits';
  if (digits.length > 10) return 'Phone number must not exceed 10 digits';
  if (!/^(97|98)\d{8}$/.test(digits)) return 'Phone number must start with 97 or 98';
  return null;
};

// Email
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

// Password
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

// Confirm password
export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

// Name (min 2 characters)
export const validateName = (name: string, label = 'Name'): string | null => {
  if (!name.trim()) return `${label} is required`;
  if (name.trim().length < 2) return `${label} must be at least 2 characters`;
  return null;
};

// Generic required
export const validateRequired = (value: string, label = 'This field'): string | null => {
  if (!value.trim()) return `${label} is required`;
  return null;
};

// Budget / price (positive number)
export const validatePositiveNumber = (value: string, label = 'Value'): string | null => {
  if (!value) return null; // optional by default
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return `${label} must be a positive number`;
  return null;
};

// Description with min length
export const validateMinLength = (value: string, min: number, label = 'This field'): string | null => {
  if (!value.trim()) return `${label} is required`;
  if (value.trim().length < min) return `${label} must be at least ${min} characters`;
  return null;
};

// Address
export const validateAddress = (address: string): string | null => {
  if (!address.trim()) return null; // optional
  if (address.trim().length < 3) return 'Address must be at least 3 characters';
  return null;
};

// Document number (for KYC)
export const validateDocumentNumber = (docNumber: string, docType: string): string | null => {
  if (!docNumber.trim()) return 'Document number is required';
  if (docType === 'CITIZENSHIP' && docNumber.trim().length < 5) {
    return 'Citizenship number must be at least 5 characters';
  }
  if (docType === 'PASSPORT' && docNumber.trim().length < 6) {
    return 'Passport number must be at least 6 characters';
  }
  if (docType === 'LICENSE' && docNumber.trim().length < 5) {
    return 'License number must be at least 5 characters';
  }
  return null;
};

// Allow only digits in phone input (strip non-digits)
export const sanitizePhone = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};
