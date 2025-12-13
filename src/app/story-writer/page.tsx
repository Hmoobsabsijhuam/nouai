import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import StoryWriterClient from './story-writer-client';

export default function StoryWriterPage() {
  return (
    <DashboardLayout>
        <StoryWriterClient />
    </DashboardLayout>
  );
}
