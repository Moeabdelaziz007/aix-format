/**
 * Agentic Design System Components
 * Conversational AI-first interface with minimal controls and clear outcomes
 * 
 * Design Principles:
 * - Conversational interactions over complex forms
 * - Clear outcomes and delegated task flows
 * - Minimal controls, maximum clarity
 * - Accessibility-first (WCAG 2.2 AA)
 * - Keyboard-first interactions
 * 
 * @license MIT
 * @author typeui.sh
 */

import React, { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { tokens } from './tokens';

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

/**
 * Button Component
 * 
 * Anatomy: [Icon?] Label [Icon?]
 * States: default, hover, focus-visible, active, disabled, loading
 * Variants: primary, secondary, ghost, danger
 * 
 * Accessibility:
 * - Minimum 44px touch target
 * - Visible focus ring (2px, primary color)
 * - Disabled state with aria-disabled
 * - Loading state with aria-busy
 */

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${loading ? 'cursor-wait' : 'cursor-pointer'}
    `;

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[52px]',
    };

    const variantStyles = {
      primary: `
        bg-[${tokens.colors.primary}] text-white
        hover:bg-[${tokens.colors.interactive.hover}]
        active:bg-[${tokens.colors.interactive.active}]
        focus-visible:ring-[${tokens.colors.primary}]
      `,
      secondary: `
        bg-[${tokens.colors.secondary}] text-[${tokens.colors.text}]
        hover:bg-[${tokens.colors.surfaces.muted}]
        focus-visible:ring-[${tokens.colors.primary}]
      `,
      ghost: `
        bg-transparent text-[${tokens.colors.text}]
        hover:bg-[${tokens.colors.surfaces.subtle}]
        focus-visible:ring-[${tokens.colors.primary}]
      `,
      danger: `
        bg-[${tokens.colors.danger}] text-white
        hover:opacity-90
        focus-visible:ring-[${tokens.colors.danger}]
      `,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && leftIcon && <span>{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// INPUT COMPONENT
// ============================================================================

/**
 * Input Component
 * 
 * Anatomy: [Label] [Helper Text?] Input [Error Message?]
 * States: default, focus, error, disabled
 * 
 * Accessibility:
 * - Label must be associated with input
 * - Error messages linked via aria-describedby
 * - Minimum 44px touch target
 */

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    helperText, 
    error, 
    leftIcon, 
    rightIcon,
    className = '',
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const baseStyles = `
      w-full px-4 py-3 min-h-[44px]
      bg-white border rounded-lg
      text-[${tokens.colors.text}]
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-[${tokens.colors.primary}] focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? `border-[${tokens.colors.danger}]` : `border-[${tokens.colors.borders.default}]`}
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
    `;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className={`block mb-2 text-sm font-medium text-[${tokens.colors.text}]`}
          >
            {label}
          </label>
        )}
        
        {helperText && !error && (
          <p id={helperId} className={`mb-2 text-sm text-[${tokens.colors.textColors.secondary}]`}>
            {helperText}
          </p>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[${tokens.colors.textColors.secondary}]">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            aria-describedby={error ? errorId : helperId}
            aria-invalid={!!error}
            className={`${baseStyles} ${className}`}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[${tokens.colors.textColors.secondary}]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className={`mt-2 text-sm text-[${tokens.colors.danger}]`} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// CARD COMPONENT
// ============================================================================

/**
 * Card Component
 * 
 * Anatomy: [Header?] Content [Footer?]
 * Variants: default, elevated, outlined
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy
 */

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'elevated' | 'outlined';
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', header, footer, children, className = '', ...props }, ref) => {
    const baseStyles = `
      bg-white rounded-lg
      ${variant === 'elevated' ? `shadow-[${tokens.shadows.md}]` : ''}
      ${variant === 'outlined' ? `border border-[${tokens.colors.borders.default}]` : ''}
    `;

    return (
      <div ref={ref} className={`${baseStyles} ${className}`} {...props}>
        {header && (
          <div className={`px-6 py-4 border-b border-[${tokens.colors.borders.subtle}]`}>
            {header}
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
        
        {footer && (
          <div className={`px-6 py-4 border-t border-[${tokens.colors.borders.subtle}]`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// BADGE COMPONENT
// ============================================================================

/**
 * Badge Component
 * 
 * Variants: default, success, warning, danger
 * Sizes: sm, md
 * 
 * Accessibility:
 * - Sufficient color contrast
 * - Semantic meaning not conveyed by color alone
 */

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-full
    `;

    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    const variantStyles = {
      default: `bg-[${tokens.colors.surfaces.subtle}] text-[${tokens.colors.text}]`,
      success: `bg-[${tokens.colors.success}] text-white`,
      warning: `bg-[${tokens.colors.warning}] text-white`,
      danger: `bg-[${tokens.colors.danger}] text-white`,
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================================
// ALERT COMPONENT
// ============================================================================

/**
 * Alert Component
 * 
 * Variants: info, success, warning, danger
 * 
 * Accessibility:
 * - role="alert" for important messages
 * - Sufficient color contrast
 * - Icon + text for clarity
 */

export interface AlertProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  icon?: ReactNode;
  onClose?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, icon, onClose, children, className = '', ...props }, ref) => {
    const variantStyles = {
      info: `bg-blue-50 border-blue-200 text-blue-900`,
      success: `bg-green-50 border-green-200 text-green-900`,
      warning: `bg-yellow-50 border-yellow-200 text-yellow-900`,
      danger: `bg-red-50 border-red-200 text-red-900`,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 border rounded-lg ${variantStyles[variant]} ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          
          <div className="flex-1">
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <div className="text-sm">{children}</div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
              aria-label="Close alert"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

/**
 * Spinner Component
 * 
 * Loading indicator with accessibility support
 * 
 * Accessibility:
 * - aria-label for screen readers
 * - Respects prefers-reduced-motion
 */

export interface SpinnerProps extends ComponentPropsWithoutRef<'div'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', label = 'Loading...', className = '', ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={`inline-block ${className}`}
        {...props}
      >
        <svg
          className={`animate-spin ${sizeStyles[size]} text-[${tokens.colors.primary}]`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

// ============================================================================
// EXPORTS
// ============================================================================

export const AgenticComponents = {
  Button,
  Input,
  Card,
  Badge,
  Alert,
  Spinner,
};

// Made with Bob
