"use client";

import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const { className, variant = "default", ...other } = props;
  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${
        variant === "destructive" 
          ? "border-destructive/50 text-destructive dark:border-destructive"
          : "bg-background text-foreground"
      }`}
      {...other}
    />
  );
});
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  (props, ref) => {
    const { className, ...other } = props;
    return (
      <div
        ref={ref}
        className="text-sm [&_p]:leading-relaxed"
        {...other}
      />
    );
  }
);
AlertDescription.displayName = "AlertDescription";