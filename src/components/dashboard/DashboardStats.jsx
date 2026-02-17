import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardStats({ stats, isLoading }) {
  const statCards = [
    {
      title: "Total",
      value: stats.total,
      icon: Calendar,
      color: "from-[#C47B3C] to-[#A56A38]",
      bgColor: "bg-amber-50"
    },
    {
      title: "Confirmadas",
      value: stats.confirmed,
      icon: CheckCircle,
      color: "from-[#C47B3C] to-[#A56A38]",
      bgColor: "bg-amber-50"
    },
    {
      title: "Lugares Reservados",
      value: stats.seatsReserved,
      subtitle: `de ${stats.totalSeats}`,
      icon: Users,
      color: "from-[#C47B3C] to-[#A56A38]",
      bgColor: "bg-amber-50"
    },
    {
      title: "Ocupação",
      value: stats.totalSeats > 0 ? `${Math.round((stats.seatsReserved / stats.totalSeats) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "from-[#C47B3C] to-[#A56A38]",
      bgColor: "bg-amber-50"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20 md:h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
          <div className={`absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 ${stat.bgColor} rounded-full opacity-20 transform translate-x-6 md:translate-x-8 -translate-y-6 md:-translate-y-8`} />
          <CardHeader className="p-2 md:p-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs font-medium text-gray-500 mb-0.5 md:mb-1 truncate">{stat.title}</p>
                <CardTitle className="text-lg md:text-2xl font-bold truncate">
                  {stat.value}
                </CardTitle>
                {stat.subtitle && (
                  <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">{stat.subtitle}</p>
                )}
              </div>
              <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-md shrink-0`}>
                <stat.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}