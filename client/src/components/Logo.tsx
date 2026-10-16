import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Logo({
  width = 36,
  height = 25,
  className = "flex-shrink-0",
  ...props
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 350"
      width={width}
      height={height}
      className={className}
      aria-label="ConfigFlow Logo"
      {...props}
    >
      <g>
        <path
          d="M 130 120 V 60 H 270 V 140"
          fill="none"
          stroke="#FF6B00"
          strokeWidth="10"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <path
          d="M 300 170 H 360"
          fill="none"
          stroke="#FF6B00"
          strokeWidth="10"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <path
          d="M 130 220 V 280 H 390 V 200"
          fill="none"
          stroke="#FF6B00"
          strokeWidth="10"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <rect
          x="70"
          y="110"
          width="120"
          height="120"
          rx="17.5"
          fill="#FF6B00"
        />
        <rect
          x="230"
          y="130"
          width="80"
          height="80"
          rx="14"
          fill="#FF6B00"
        />
        <rect
          x="350"
          y="130"
          width="80"
          height="80"
          rx="14"
          fill="#FF6B00"
        />
      </g>
    </svg>
  );
}

export default Logo;
