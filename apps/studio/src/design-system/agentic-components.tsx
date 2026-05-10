import React, { forwardRef } from 'react';

export const Box = ({ children, className = '', ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

export const Text = ({ children, className = '', ...props }: any) => (
  <span className={className} {...props}>{children}</span>
);

export const ErrorBoundary = ({ children }: any) => (
  <React.Fragment>{children}</React.Fragment>
);

export const Badge = ({ children, className = '', variant = 'default' }: any) => (
  <span className={`px-2 py-1 rounded text-xs font-bold border ${className}`}>{children}</span>
);

export const Button = forwardRef(({ children, className = '', variant = 'primary', ...props }: any, ref: any) => (
  <button ref={ref} className={`px-4 py-2 rounded transition-all ${className}`} {...props}>{children}</button>
));
Button.displayName = 'Button';

export const Card = ({ children, className = '' }: any) => (
  <div className={`rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl ${className}`}>{children}</div>
);

export const VoiceOrb = ({ children, className = '' }: any) => (
  <div className={`w-24 h-24 rounded-full bg-indigo-500/20 animate-pulse ${className}`}>{children}</div>
);

export const Typography = ({ children, variant = 'body', className = '' }: any) => (
  <p className={className}>{children}</p>
);
