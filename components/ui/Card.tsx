import { ReactNode } from 'react';
import { Card as AntCard } from 'antd';
import { CardProps as AntCardProps } from 'antd/es/card';

interface CustomCardProps extends AntCardProps {
  children: ReactNode;
}

export default function Card({ children, ...props }: CustomCardProps) {
  return (
    <AntCard {...props}>
      {children}
    </AntCard>
  );
}