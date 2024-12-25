"use client";

import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  className?: string;
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const { variant = "default", className = "", ...other } = props;
  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${
        variant === "destructive" 
          ? "border-destructive/50 text-destructive dark:border-destructive"
          : "bg-background text-foreground"
      } ${className}`}
      {...other}
    />
  );
});

Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      {...props}
    />
  )
);

AlertDescription.displayName = "AlertDescription";