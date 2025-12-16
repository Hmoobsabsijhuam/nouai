'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import AnimatedBackground from '@/components/auth/animated-background';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 text-center">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center">
        <Logo width={300} height={300} />
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Welcome to Nou AI
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/80">
          Unlock your creativity with the power of AI. Generate images, videos, and audio from simple text prompts.
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
           <Button asChild size="lg" variant="secondary">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
