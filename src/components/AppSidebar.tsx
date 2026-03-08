import { useAuth } from '@/hooks/useAuth';
import { useBengkelProfile } from '@/hooks/useSupabaseData';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, FileText, ScanBarcode, Package, CalendarCheck,
  Users, BarChart3, Settings, LogOut, Wrench, ChevronDown, Store, ClipboardList, History, Download, UserCog,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transaksi Servis', url: '/transaksi', icon: FileText },
  { title: 'Riwayat Transaksi', url: '/riwayat', icon: History },
  { title: 'Scan Sparepart', url: '/scan', icon: ScanBarcode },
];

const sparepartSubmenu = [
  { title: 'Stok Sparepart', url: '/sparepart' },
  { title: 'Pembelian Barang', url: '/pembelian' },
];

const laporanSubmenu = [
  { title: 'Laporan Umum', url: '/laporan' },
  { title: 'Laporan Laba', url: '/laporan/laba' },
];

const pengaturanSubmenu = [
  { title: 'Umum', url: '/pengaturan' },
  { title: 'Printer Bluetooth', url: '/printer' },
  { title: 'Install Aplikasi', url: '/install' },
];

const bottomMenuItems = [
  { title: 'Layanan', url: '/layanan', icon: ClipboardList },
  { title: 'Booking Servis', url: '/booking', icon: CalendarCheck },
  { title: 'Pelanggan', url: '/pelanggan', icon: Users },
  { title: 'Profil Bengkel', url: '/profil', icon: Store },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { logout, user } = useAuth();
  const { profile } = useBengkelProfile();

  const isSparepart = location.pathname === '/sparepart' || location.pathname === '/pembelian';
  const isLaporan = location.pathname.startsWith('/laporan');
  const isPengaturan = location.pathname === '/pengaturan' || location.pathname === '/printer' || location.pathname === '/install';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-sidebar-accent-foreground truncate">{profile?.nama || 'BengkelPOS'}</h2>
              <p className="text-xs text-sidebar-foreground truncate">{user?.role === 'admin' ? 'Administrator' : 'Kasir'}</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Sparepart with submenu */}
              <Collapsible defaultOpen={isSparepart} className="group/collapsible-sp">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isSparepart} className="hover:bg-sidebar-accent">
                      <Package className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Sparepart</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible-sp:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {sparepartSubmenu.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === sub.url}>
                              <NavLink to={sub.url} end className="hover:bg-sidebar-accent" activeClassName="text-sidebar-primary font-medium">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Other menu items */}
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Laporan with submenu */}
              <Collapsible defaultOpen={isLaporan} className="group/collapsible-lap">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isLaporan} className="hover:bg-sidebar-accent">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Laporan</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible-lap:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {laporanSubmenu.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === sub.url}>
                              <NavLink to={sub.url} end className="hover:bg-sidebar-accent" activeClassName="text-sidebar-primary font-medium">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Pengaturan with submenu */}
              <Collapsible defaultOpen={isPengaturan} className="group/collapsible-set">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isPengaturan} className="hover:bg-sidebar-accent">
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Pengaturan</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible-set:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {pengaturanSubmenu.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === sub.url}>
                              <NavLink to={sub.url} end className="hover:bg-sidebar-accent" activeClassName="text-sidebar-primary font-medium">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} className="text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Logout</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
