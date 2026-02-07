import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties; // Fixes the split input layout
}

// strict generic typing to allow passing ref
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperStyle, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="input-wrapper" style={wrapperStyle}>
        {label && <label className="input-label">{label}</label>}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref} // Allows the parent to control focus/read value
            type={isPassword && showPassword ? 'text' : type}
            className={`custom-input ${error ? 'input-error' : ''} ${className}`}
            style={isPassword ? { paddingRight: '44px' } : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#888',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Helpful for debugging

export default Input;