import React, { useState } from 'react';

interface BotanicalImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const BotanicalImage: React.FC<BotanicalImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle = 'Botanical Iris Specimen',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E152A] p-6 text-center text-[#FAF8FC] ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          viewBox="0 0 64 64"
          className="mb-3 h-10 w-10 text-[#DDD6FE]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M32 10c6 8 10 15 10 22a10 10 0 1 1-20 0c0-7 4-14 10-22Z" />
          <path d="M32 32c-8-4-16-2-20 4 6 6 14 7 20 3" />
          <path d="M32 32c8-4 16-2 20 4-6 6-14 7-20 3" />
          <path d="M32 42v14" />
        </svg>
        <span className="font-editorial text-sm font-medium">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
