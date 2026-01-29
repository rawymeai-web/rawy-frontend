
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-8 py-3 font-bold rounded-full shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    // Primary: Orange (#F69338) -> Hover: Darker Orange
    primary: 'bg-brand-orange text-white hover:bg-[#d97b26] focus:ring-brand-orange',
    // Secondary: Teal (#00AF42) -> Hover: Darker Teal
    secondary: 'bg-brand-teal text-white hover:bg-[#008f35] focus:ring-brand-teal',
    // Outline: Navy Border (as requested in Option B)
    outline: 'bg-transparent border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white focus:ring-brand-navy',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
