import { Logo } from '@/components/icons/logo';
import AnimatedBackgroundClient from '@/components/auth/animated-background-client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <AnimatedBackgroundClient />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo width={200} height={200} />
        </div>
        {children}
      </div>
    </div>
  );
}
