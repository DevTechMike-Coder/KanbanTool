import React from "react";

interface SidebarIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string;
  title?: string;
}

export const SidebarIcon: React.FC<SidebarIconProps> = ({
  size = 24,
  className = "",
  title = "Sidebar",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={`shrink-0 text-zinc-700 transition-colors duration-200 hover:text-indigo-600 ${className}`}
      {...props}
    >
      <title>{title}</title>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 4v16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 8h4.5M12.5 12h3.5M12.5 16h4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="6.25" cy="7.5" r="1" className="fill-current text-indigo-500" />
      <circle cx="6.25" cy="12" r="1" className="fill-current text-emerald-500" />
      <circle cx="6.25" cy="16.5" r="1" className="fill-current text-amber-500" />
    </svg>
  );
};

export default SidebarIcon;
