import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authService } from "@/services/auth.service";
import { LayoutDashboard, Users, Settings, Calendar, Home, LogOut, TrendingUp, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";

const userNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    order: 1,
    isCenter: true,
    desktopOrder: 1
  },
  {
    title: "Reservas",
    url: createPageUrl("Reservations"),
    icon: Calendar,
    order: 2,
    desktopOrder: 2
  },
  {
    title: "Clientes",
    url: createPageUrl("Customers"),
    icon: Users,
    order: 3,
    desktopOrder: 3
  },
  {
    title: "Insights",
    url: createPageUrl("Insights"),
    icon: TrendingUp,
    order: 4,
    desktopOrder: 4
  },
  {
    title: "Config",
    url: createPageUrl("Settings"),
    icon: Settings,
    order: 5,
    desktopOrder: 5
  },
];

const adminNavigationItems = [
  {
    title: "Admin Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: LayoutDashboard,
    order: 1
  },
  {
    title: "Usuários",
    url: createPageUrl("AdminUsers"),
    icon: Users,
    order: 2
  },
  {
    title: "Pagamentos",
    url: createPageUrl("AdminPayments"),
    icon: TrendingUp,
    order: 3
  },
  {
    title: "Configurações",
    url: createPageUrl("AdminSettings"),
    icon: Settings,
    order: 4
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  
  // Lista de páginas que NÃO precisam de autenticação
  const publicPages = ["BookingPublic", "PublicBooking", "Login", "Plans"];
  
  // Verificar se é página pública ANTES de tudo - verificações mais robustas
  const isPublicPage = publicPages.includes(currentPageName) || 
                       location.pathname.toLowerCase().includes('bookingpublic') ||
                       location.pathname.toLowerCase().includes('publicbooking') ||
                       location.search.includes('slug=');

  // EARLY RETURN para páginas públicas - sem estados, sem efeitos, sem nada
  if (isPublicPage) {
    console.log('✅ Página pública detectada:', currentPageName, location.pathname, location.search);
    return <div className="min-h-screen">{children}</div>;
  }

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const checkAuthentication = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        // Redirecionar para login e após login voltar para Dashboard
        authService.redirectToLogin(createPageUrl("Dashboard"));
        return;
      }
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth error:", error);
      authService.redirectToLogin(createPageUrl("Dashboard"));
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  // Loading state apenas para páginas privadas
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Layout para páginas privadas/administrativas
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-amber-50/30">
        {/* Sidebar Desktop */}
        <Sidebar className={`border-r border-gray-200 bg-white hidden md:flex transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              {sidebarOpen ? (
                <div className="flex items-center gap-3">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/e8bb9b709_LOGOS16.png" 
                    alt="Logo" 
                    className="w-10 h-10 rounded-xl object-cover shadow-lg"
                  />
                  <div>
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/df3f23b2d_FULLBLACKSEMREGISTROpdf7.png" 
                      alt="DOMUS" 
                      className="h-6 w-auto"
                    />
                    <p className="text-xs text-gray-500">Sistema de Reservas</p>
                  </div>
                </div>
              ) : (
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/e8bb9b709_LOGOS16.png" 
                  alt="Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg mx-auto"
                />
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              {sidebarOpen && (
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Navegação
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {userNavigationItems.sort((a, b) => a.desktopOrder - b.desktopOrder).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-amber-50 hover:text-[#A56A38] transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-[#C47B3C] to-[#A56A38] text-white hover:from-[#D48B4C] hover:to-[#B57A48] shadow-md' : ''
                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                      >
                        <Link to={item.url} className={`flex items-center gap-3 px-3 py-2.5 ${!sidebarOpen ? 'justify-center' : ''}`}>
                          <item.icon className="w-5 h-5" />
                          {sidebarOpen && <span className="font-medium">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user?.role === 'admin' && (
              <SidebarGroup className="mt-4">
                {sidebarOpen && (
                  <SidebarGroupLabel className="text-xs font-semibold text-purple-600 uppercase tracking-wider px-3 py-2">
                    Painel Admin
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md' : ''
                          } ${!sidebarOpen ? 'justify-center' : ''}`}
                        >
                          <Link to={item.url} className={`flex items-center gap-3 px-3 py-2.5 ${!sidebarOpen ? 'justify-center' : ''}`}>
                            <item.icon className="w-5 h-5" />
                            {sidebarOpen && <span className="font-medium">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <div className="space-y-3">
              {sidebarOpen ? (
                <>
                  <Link 
                    to={createPageUrl("Profile")}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {user?.full_name || user?.email || 'Administrador'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">Ver perfil</p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link 
                    to={createPageUrl("Profile")}
                    className="flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header Mobile */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-10 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/e8bb9b709_LOGOS16.png" 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-cover shadow-md"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/df3f23b2d_FULLBLACKSEMREGISTROpdf7.png" 
                  alt="DOMUS" 
                  className="h-5 w-auto"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Header Desktop */}
          <header className="hidden md:block bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/df3f23b2d_FULLBLACKSEMREGISTROpdf7.png" 
                alt="DOMUS" 
                className="h-7 w-auto"
              />
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto pb-24 md:pb-0">
            {children}
          </div>

          {/* Bottom Navigation Mobile */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-gray-200/50 px-2 py-2">
              <div className="flex items-center justify-between gap-1">
                {userNavigationItems.sort((a, b) => a.order - b.order).map((item) => {
                  const isActive = location.pathname === item.url;
                  
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className="flex-1"
                    >
                      <div className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-50' 
                          : 'hover:bg-gray-50'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-br from-[#C47B3C] to-[#A56A38] shadow-lg'
                            : 'bg-transparent'
                        }`}>
                          <item.icon className={`w-5 h-5 ${
                            isActive ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <span className={`text-[10px] font-medium mt-1 ${
                          isActive ? 'text-[#A56A38]' : 'text-gray-600'
                        }`}>
                          {item.title}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </main>
      </div>
    </SidebarProvider>
  );
}