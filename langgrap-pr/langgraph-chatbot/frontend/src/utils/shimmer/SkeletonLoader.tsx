import React from "react";

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-gray-700 rounded-md ${
        className || "h-4 w-full"
      }`}
    />
  );
};

export default SkeletonLoader;
