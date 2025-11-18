
'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreditCard, Zap } from 'lucide-react';

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
         <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex flex-col items-center gap-4">
                    <Zap className="h-12 w-12 text-primary" />
                    <CardTitle className="text-3xl">Go Pro!</CardTitle>
                    <CardDescription>This feature is coming soon!</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Unlock advanced features, get more credits, and enjoy priority support. The billing and credit system is under construction.
                </p>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
