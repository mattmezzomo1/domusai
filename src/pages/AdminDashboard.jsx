import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Building2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.me();
        if (currentUser?.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);
  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.asServiceRole.entities.User.list(),
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => base44.asServiceRole.entities.Subscription.list(),
  });

  const { data: allRestaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => base44.asServiceRole.entities.Restaurant.list(),
  });

  const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  const totalRevenue = activeSubscriptions.length * 197;

  const stats = [
    {
      title: "Total de Usuários",
      value: allUsers.length,
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Assinaturas Ativas",
      value: activeSubscriptions.length,
      icon: CreditCard,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Restaurantes",
      value: allRestaurants.length,
      icon: Building2,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      color: "from-orange-500 to-red-500"
    }
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Painel Administrativo</h1>
          <p className="text-xs md:text-sm text-gray-500">Visão geral da plataforma Domus</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {stats.map((stat, idx) => (
            <Card key={idx} className="shadow-lg border-none overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
              <CardHeader className="flex flex-row items-center justify-between pb-1 p-2 md:p-3">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-10`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-3 pt-0">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Últimos Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allUsers.slice(-5).reverse().map(user => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Últimas Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allSubscriptions.slice(-5).reverse().map(sub => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{sub.user_email}</p>
                      <p className="text-sm text-gray-500">{sub.plan_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : sub.status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}