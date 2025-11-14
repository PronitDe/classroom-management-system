import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, ClipboardList, Home, FileText, AlertCircle, LogOut } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-destructive/20 text-destructive';
      case 'SPOC': return 'bg-primary/20 text-primary';
      case 'TEACHER': return 'bg-accent/20 text-accent';
      case 'STUDENT': return 'bg-secondary/20 text-secondary';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-sidebar-foreground truncate">{profile?.name || 'User'}</h2>
              <Badge className={`text-xs mt-1 ${getRoleBadgeColor(profile?.role || '')}`}>{profile?.role}</Badge>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors rounded-lg"
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

      <SidebarFooter className="border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
