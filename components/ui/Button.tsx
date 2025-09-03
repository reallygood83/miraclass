import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button as AntButton } from 'antd';
import { ButtonProps as AntButtonProps } from 'antd/es/button';

interface CustomButtonProps extends Omit<AntButtonProps, 'type'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'middle' | 'large';
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'middle',
  ...props 
}: CustomButtonProps) {
  const getButtonType = (variant: string) => {
    switch (variant) {
      case 'primary': return 'primary';
      case 'danger': return 'primary';
      case 'ghost': return 'ghost';
      default: return 'default';
    }
  };

  const isDanger = variant === 'danger';

  return (
    <AntButton
      type={getButtonType(variant)}
      size={size}
      danger={isDanger}
      {...props}
    >
      {children}
    </AntButton>
  );
}