import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  className?: string;
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const { variant = "default", ...other } = props;
  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${
        variant === "destructive" 
          ? "border-destructive/50 text-destructive dark:border-destructive"
          : "bg-background text-foreground"
      } ${props.className || ''}`}
      {...other}
    />
  );
});
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>((props, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${props.className || ''}`}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";