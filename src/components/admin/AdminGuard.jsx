import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }) {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Admin check error:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50/30 p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área. Apenas administradores podem visualizar este conteúdo.
          </p>
          <p className="text-sm text-gray-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}