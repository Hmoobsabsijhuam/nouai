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
  SidebarTrigger,
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
import { Home, LayoutGrid, Library, LogOut, MoreHorizontal, Settings, Shield, Wand, Bot, PanelLeft, X } from 'lucide-react';
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
          collapsible="icon"
          className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex"
        >
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Nou AI</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4 pt-0">
            <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
                <SidebarMenu>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Home">
                            <Link href="/"><Home /> <span>Home</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/feed'} tooltip="Feed">
                            <Link href="#"><Library /> <span>Feed</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/challenges'} tooltip="Challenge">
                            <Link href="#"><Bot /> <span>Challenge</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Studio</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === '/generate-image' ||
                      pathname === '/text-to-video' ||
                      pathname === '/image-to-video'
                    }
                     tooltip="Create"
                  >
                    <Link href="/generate-image">
                      <Wand /> <span>Create</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/apps'} tooltip="Apps">
                        <Link href="#"><LayoutGrid /> <span>Apps</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
             <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Library</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/gallery'} tooltip="Gallery">
                            <Link href="#"><Library /> <span>Gallery</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
            <div className="group-data-[collapsible=icon]:hidden">
                <UserProfile />
            </div>
             <div className="hidden group-data-[collapsible=icon]:block">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={useFirebase().user?.photoURL ?? ''} />
                                <AvatarFallback>{useFirebase().user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="w-56">
                        {/* ... same as UserProfile dropdown ... */}
                         <DropdownMenuItem asChild>
                            <Link href="/profile">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex flex-col md:flex-row flex-1">
           <div className="md:hidden p-4 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-7 w-7 text-primary" />
                    <span className="text-md font-bold">Nou AI</span>
                </Link>
              </div>
              <Link href="/" passHref>
                <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </Button>
              </Link>
           </div>

          {/* Middle Column: Control Panel */}
          <div className="w-full md:w-[400px] bg-background p-4 border-b md:border-b-0 md:border-r flex flex-col">
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
