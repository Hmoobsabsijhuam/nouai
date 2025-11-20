
import { Suspense } from 'react';
import ProfileClient from './profile-client';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

function ProfileSkeleton() {
  return (
    <DashboardLayout>
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileClient />
    </Suspense>
  );
}
