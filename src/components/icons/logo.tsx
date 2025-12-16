import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 512, height = 512, className }: LogoProps) {
  return (
    <Image
      src="/nouailogo.png"
      alt="Nou AI Logo"
      width={width}
      height={height}
      className={cn(className)}
    />
  );
}
