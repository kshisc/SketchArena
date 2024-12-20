import React from 'react';
import './Button.css';

interface ButtonProps {
  text: string;
  onClick: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ text, onClick, className }) => {
  return (
    <button onClick={onClick} className={`button ${className}`}>
      {text}
    </button>
  );
};

export default Button;


