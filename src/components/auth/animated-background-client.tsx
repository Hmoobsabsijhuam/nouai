'use client';

import dynamic from 'next/dynamic';

const AnimatedBackground = dynamic(
  () => import('@/components/auth/animated-background'),
  { ssr: false }
);

export default function AnimatedBackgroundClient() {
  return <AnimatedBackground />;
}
