
'use client';

import AnimatedBackground from './animated-background';

// This component was causing a ChunkLoadError because it was dynamically importing
// another component that was also marked as a client component.
// The dynamic import has been removed to fix the issue.
export default function AnimatedBackgroundClient() {
  return <AnimatedBackground />;
}
