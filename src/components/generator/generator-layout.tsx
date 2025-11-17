'use client';

import { useFirebase } from '@/firebase';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, LayoutGrid, Library, LogOut, MoreHorizontal, Settings, Shield, Wand, Bot } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../icons/logo';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signOut } from 'firebase/auth';

function UserProfile() {
  const { user, auth } = useFirebase();
  const router = useRouter();
  
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (!user) return null;

  const name = user.displayName || user.email;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.photoURL ?? ''} />
          <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">{name}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          {user.email === 'admin@noukha.com' && (
            <DropdownMenuItem asChild>
                <Link href="/">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function GeneratorLayout({
  children,
  activeTab,
  controlPanel,
  contentPanel,
}: {
  children?: React.ReactNode;
  activeTab: 'image' | 'video' | 'animate';
  controlPanel: React.ReactNode;
  contentPanel: React.ReactNode;
}) {
  const pathname = usePathname();
   const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === 'image') router.push('/generate-image');
    if (value === 'video') router.push('/text-to-video');
    if (value === 'animate') router.push('/image-to-video');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="none"
          className="w-64 bg-sidebar border-r border-sidebar-border"
        >
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-lg font-bold">Nou AI</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4 pt-0">
            <SidebarGroup>
                <SidebarGroupLabel>Community</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/feed'}>
                            <Link href="#"><Library /> Feed</Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/challenges'}>
                            <Link href="#"><Bot /> Challenge</Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                            <Link href="/profile"><Home /> Profile</Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Studio</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === '/generate-image' ||
                      pathname === '/text-to-video' ||
                      pathname === '/image-to-video'
                    }
                  >
                    <Link href="/generate-image">
                      <Wand /> Create
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/apps'}>
                        <Link href="#"><LayoutGrid /> Apps</Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
             <SidebarGroup>
                <SidebarGroupLabel>Library</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/gallery'}>
                            <Link href="#"><Library /> Gallery</Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <UserProfile />
          </SidebarFooter>
        </Sidebar>

        <main className="flex flex-1">
          {/* Middle Column: Control Panel */}
          <div className="w-[400px] bg-background p-4 border-r flex flex-col">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="animate">Animate</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 overflow-y-auto">
                {controlPanel}
            </div>
          </div>

          {/* Right Column: Content Feed */}
          <div className="flex-1 bg-secondary p-4 overflow-y-auto">
            {contentPanel}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
