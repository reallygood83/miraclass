import { ReactNode } from 'react';
import { Button as AntButton } from 'antd';
import { ButtonProps as AntButtonProps } from 'antd';

interface CustomButtonProps extends AntButtonProps {
  children: ReactNode;
}

export default function Button({ 
  children, 
  type = 'primary',
  size = 'middle',
  ...props 
}: CustomButtonProps) {
  return (
    <AntButton
      type={type}
      size={size}
      {...props}
    >
      {children}
    </AntButton>
  );
}