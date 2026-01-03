import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties; // Fixes the split input layout
}

// strict generic typing to allow passing ref
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperStyle, className = '', ...props }, ref) => {
    return (
      <div className="input-wrapper" style={wrapperStyle}>
        {label && <label className="input-label">{label}</label>}
        <input
          ref={ref} // Allows the parent to control focus/read value
          className={`custom-input ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Helpful for debugging

export default Input;