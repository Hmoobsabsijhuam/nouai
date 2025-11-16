'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, FileText, Bell, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--primary))",
  },
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function UserDashboard({ user }: { user: any }) {
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Welcome, {user.displayName || user.email}!
      </h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
           <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>A summary of your recent activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">No new notifications.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg font-medium text-green-600">
                You are logged in.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your session is secure and managed by Firebase.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Your session is persistent. You will remain logged in until you explicitly log out.
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="relative h-full min-h-[150px]">
             <Image
                src="https://picsum.photos/seed/1/600/400"
                alt="Abstract art representing security"
                fill
                className="object-cover"
                data-ai-hint="security abstract"
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  const isAdmin = user.email === 'admin@noukha.com';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}
      </main>
    </div>
  );
}
