import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'text';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading,
  className = '',
  ...props 
}) => {
  // Base classes
  let classes = `custom-btn btn-${variant}`;
  if (fullWidth) classes += ' btn-full';
  
  return (
    <button className={`${classes} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;