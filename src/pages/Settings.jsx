import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Layers, Clock, Users, AlertCircle, Calendar } from "lucide-react";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

import RestaurantSettings from "../components/settings/RestaurantSettings";
import EnvironmentsSettings from "../components/settings/EnvironmentsSettings";
import TablesSettings from "../components/settings/TablesSettings";
import ShiftsSettings from "../components/settings/ShiftsSettings";
import ExceptionsSettings from "../components/settings/ExceptionsSettings";
import AdvancedSettings from "../components/settings/AdvancedSettings";

export default function Settings() {
  return (
    <SubscriptionGuard>
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-500">Gerencie as configurações do seu restaurante</p>
        </div>

        <Tabs defaultValue="restaurant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto gap-2 bg-transparent">
            <TabsTrigger 
              value="restaurant" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Restaurante
            </TabsTrigger>
            <TabsTrigger 
              value="environments"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <Layers className="w-4 h-4 mr-2" />
              Ambientes
            </TabsTrigger>
            <TabsTrigger 
              value="tables"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Mesas
            </TabsTrigger>
            <TabsTrigger 
              value="shifts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Turnos
            </TabsTrigger>
            <TabsTrigger 
              value="exceptions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Exceções
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white shadow-sm py-3 text-xs md:text-sm"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant">
            <RestaurantSettings />
          </TabsContent>

          <TabsContent value="environments">
            <EnvironmentsSettings />
          </TabsContent>

          <TabsContent value="tables">
            <TablesSettings />
          </TabsContent>

          <TabsContent value="shifts">
            <ShiftsSettings />
          </TabsContent>

          <TabsContent value="exceptions">
            <ExceptionsSettings />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </SubscriptionGuard>
  );
}