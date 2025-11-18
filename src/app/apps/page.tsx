
'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, UserCircle } from 'lucide-react';

const apps = [
  {
    title: 'AI Story Writer',
    description: 'Generate short stories from a simple text prompt.',
    href: '/story-writer',
    icon: <BookOpen className="h-8 w-8 text-primary" />,
  },
  {
    title: 'AI Avatar Generator',
    description: 'Create unique, stylized avatars and profile pictures.',
    href: '/avatar-generator',
    icon: <UserCircle className="h-8 w-8 text-primary" />,
  },
];

export default function AppsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Creative Apps</h1>
        <p className="text-muted-foreground">
          Explore specialized tools to supercharge your creativity.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Link href={app.href} key={app.title} className="group">
            <Card className="h-full hover:border-primary transition-colors hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {app.icon}
                    {app.title}
                  </CardTitle>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{app.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
