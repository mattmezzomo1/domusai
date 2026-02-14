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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
          <div className={`absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 ${stat.bgColor} rounded-full opacity-20 transform translate-x-8 md:translate-x-12 -translate-y-8 md:-translate-y-12`} />
          <CardHeader className="p-3 md:p-6">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2 truncate">{stat.title}</p>
                <CardTitle className="text-xl md:text-3xl font-bold truncate">
                  {stat.value}
                </CardTitle>
                {stat.subtitle && (
                  <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">{stat.subtitle}</p>
                )}
              </div>
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} shadow-md shrink-0`}>
                <stat.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}