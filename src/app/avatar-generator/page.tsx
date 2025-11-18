
'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function AvatarGeneratorPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
         <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex flex-col items-center gap-4">
                    <UserCircle className="h-12 w-12 text-primary" />
                    <CardTitle className="text-3xl">AI Avatar Generator</CardTitle>
                    <CardDescription>This feature is coming soon!</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Soon you'll be able to create stunning, unique avatars for your profiles. Get ready to generate your new look!
                </p>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
