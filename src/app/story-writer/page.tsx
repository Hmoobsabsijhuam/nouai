
'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function StoryWriterPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex flex-col items-center gap-4">
                    <BookOpen className="h-12 w-12 text-primary" />
                    <CardTitle className="text-3xl">AI Story Writer</CardTitle>
                    <CardDescription>This feature is coming soon!</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Get ready to bring your stories to life. The AI Story Writer will help you craft compelling narratives from just a single prompt.
                </p>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
