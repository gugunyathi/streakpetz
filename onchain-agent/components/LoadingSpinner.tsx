'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'purple' | 'blue';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'white', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    white: 'border-white',
    purple: 'border-purple-500',
    blue: 'border-blue-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className={`mt-2 text-sm ${color === 'white' ? 'text-white' : `text-${color}-600`}`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Inline loading spinner for buttons
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ${className}`} />
  );
}

// Full screen loading overlay
export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}