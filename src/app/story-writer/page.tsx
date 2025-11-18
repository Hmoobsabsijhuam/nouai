
'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, X } from 'lucide-react';

export default function StoryWriterPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-2xl relative">
             <Link href="/apps" passHref>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </Link>
            <CardHeader>
                <div className="flex flex-col items-center gap-4 pt-8">
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
