import React from "react";

export const Logo: React.FC = () => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <path
        d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM16 6C16.828 6 17.5 6.672 17.5 7.5C17.5 8.328 16.828 9 16 9C15.172 9 14.5 8.328 14.5 7.5C14.5 6.672 15.172 6 16 6ZM22 22H10V20H14V14H12V12H18V20H22V22Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Logo;
