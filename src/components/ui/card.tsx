"use client";

import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div
      ref={ref}
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
      {...other}
    />
  );
});
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div
      ref={ref}
      className="flex flex-col space-y-1.5 p-6"
      {...other}
    />
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <h3
      ref={ref}
      className="text-2xl font-semibold leading-none tracking-tight"
      {...other}
    />
  );
});
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div 
      ref={ref} 
      className="p-6 pt-0" 
      {...other} 
    />
  );
});
CardContent.displayName = "CardContent";