import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import StoryWeaverClient from './story-weaver-client';

export default function StoryWeaverPage() {
  return (
    <DashboardLayout>
        <StoryWeaverClient />
    </DashboardLayout>
  );
}
