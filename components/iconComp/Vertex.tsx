import React from "react";

interface VertexIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string;
}

export const VertexIcon: React.FC<VertexIconProps> = ({
  size = 24,
  className = "",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 overflow-visible ${className}`}
      {...props}
    >
      <style>
        {`
          .vertex-orbit {
            transform-box: fill-box;
            transform-origin: center;
            animation: vertex-spin 5s linear infinite;
          }

          .vertex-core {
            transform-box: fill-box;
            transform-origin: center;
            animation: vertex-pulse 2.4s ease-in-out infinite;
          }

          .vertex-node {
            transform-box: fill-box;
            transform-origin: center;
            animation: vertex-node-pulse 2.4s ease-in-out infinite;
          }

          .vertex-node:nth-of-type(2) { animation-delay: 0.2s; }
          .vertex-node:nth-of-type(3) { animation-delay: 0.4s; }
          .vertex-node:nth-of-type(4) { animation-delay: 0.6s; }
          .vertex-node:nth-of-type(5) { animation-delay: 0.8s; }

          .vertex-link {
            stroke-dasharray: 7;
            stroke-dashoffset: 14;
            animation: vertex-flow 2.8s ease-in-out infinite;
          }

          @keyframes vertex-spin {
            to { transform: rotate(360deg); }
          }

          @keyframes vertex-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.18); opacity: 0.82; }
          }

          @keyframes vertex-node-pulse {
            0%, 100% { transform: scale(1); opacity: 0.75; }
            50% { transform: scale(1.35); opacity: 1; }
          }

          @keyframes vertex-flow {
            0% { stroke-dashoffset: 14; opacity: 0.35; }
            45%, 60% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.35; }
          }

          @media (prefers-reduced-motion: reduce) {
            .vertex-orbit,
            .vertex-core,
            .vertex-node,
            .vertex-link {
              animation: none;
            }
          }
        `}
      </style>

      <g className="text-gray-900 dark:text-white">
        <path
          d="M12 4v5M12 15v5M4 12h5M15 12h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="vertex-link"
        />
        <circle
          cx="12"
          cy="12"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="1 4"
          strokeLinecap="round"
          opacity="0.45"
          className="vertex-orbit"
        />
      </g>

      <g className="fill-current text-indigo-500">
        <circle cx="12" cy="4" r="1.6" className="vertex-node" />
        <circle cx="20" cy="12" r="1.6" className="vertex-node" />
        <circle cx="12" cy="20" r="1.6" className="vertex-node" />
        <circle cx="4" cy="12" r="1.6" className="vertex-node" />
        <circle cx="12" cy="12" r="3.2" className="vertex-core" />
      </g>
    </svg>
  );
};

export default VertexIcon;
