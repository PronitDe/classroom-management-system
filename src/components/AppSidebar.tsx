import { Building2, Calendar, ClipboardList, Home, FileText, AlertCircle, Users, BarChart3, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { profile, signOut } = useAuth();

  const teacherItems = [
    { title: 'Dashboard', url: '/teacher/dashboard', icon: Home },
    { title: 'Book Room', url: '/teacher/book', icon: Calendar },
    { title: 'Current Class', url: '/teacher/attendance', icon: ClipboardList },
    { title: 'History', url: '/teacher/history', icon: FileText },
    { title: 'Report Issue', url: '/teacher/issues', icon: AlertCircle },
  ];

  const spocItems = [
    { title: 'Dashboard', url: '/spoc/dashboard', icon: Home },
    { title: 'Manage Rooms', url: '/spoc/rooms', icon: Building2 },
    { title: 'Bookings', url: '/spoc/bookings', icon: Calendar },
    { title: 'Issues', url: '/spoc/issues', icon: AlertCircle },
  ];

  const adminItems = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: Home },
    { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
    { title: 'Users', url: '/admin/users', icon: Users },
  ];

  const studentItems = [
    { title: 'Dashboard', url: '/student/dashboard', icon: Home },
  ];

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'TEACHER':
        return teacherItems;
      case 'SPOC':
        return spocItems;
      case 'ADMIN':
        return adminItems;
      case 'STUDENT':
        return studentItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-xl font-bold text-sidebar-foreground">
            SOET CMS
          </h2>
          <p className="text-sm text-sidebar-foreground/70 mt-1">
            {profile?.name}
          </p>
          <p className="text-xs text-sidebar-foreground/50">
            {profile?.role}
          </p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
