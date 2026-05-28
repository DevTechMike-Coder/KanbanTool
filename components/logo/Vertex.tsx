import React from 'react';

// Extend standard SVG attributes to make the component fully flexible
interface VertexIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export const VertexIcon: React.FC<VertexIconProps> = ({
  size = 24, // Default fallback size
  className = '',
  ...props
}) => {
  return (
    <svg
      // Dynamically handle sizing while keeping it responsive
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // Combine incoming custom classes with base styling
      className={`shrink-0 ${className}`}
      {...props}
    >
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        className="fill-current text-indigo-500" 
      />
      <path 
        d="M12 2v7M12 15v7M2 12h7M15 12h7" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        className="text-gray-900 dark:text-white" 
      />
    </svg>
  );
};

export default VertexIcon;