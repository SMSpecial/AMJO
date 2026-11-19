import React, { useState } from 'react';
import { CarFront } from 'lucide-react';

interface VehicleImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const VehicleImage: React.FC<VehicleImageProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950 text-zinc-500 dark:text-zinc-400 p-6 text-center ${className}`}
      >
        <CarFront className="w-10 h-10 mb-2 opacity-60 text-[#C9A227]" />
        <span className="text-xs font-medium max-w-[200px] truncate">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
};
