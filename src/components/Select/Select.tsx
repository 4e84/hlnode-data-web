import { forwardRef } from "react";
import styles from "./Select.module.css";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fullWidth, children, ...props }, ref) => {
    const classes = [styles.select, fullWidth && styles.fullWidth, className]
      .filter(Boolean)
      .join(" ");

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
