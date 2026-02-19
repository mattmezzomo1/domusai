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
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600"
    },
    {
      title: "Confirmadas",
      value: stats.confirmed,
      icon: CheckCircle,
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Lugares Reservados",
      value: stats.seatsReserved,
      subtitle: `de ${stats.totalSeats}`,
      icon: Users,
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Ocupação",
      value: stats.totalSeats > 0 ? `${Math.round((stats.seatsReserved / stats.totalSeats) * 100)}%` : "0%",
      icon: TrendingUp,
      iconBgColor: "bg-pink-100",
      iconColor: "text-pink-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 md:h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600 truncate">{stat.title}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{stat.subtitle}</p>
                )}
              </div>
              <div className={`${stat.iconBgColor} p-2.5 md:p-3 rounded-full shrink-0`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}