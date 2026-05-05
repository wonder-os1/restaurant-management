"use client";

import {
  ShoppingCart,
  IndianRupee,
  Armchair,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface StatsCardsProps {
  todayOrders: number;
  todayRevenue: number;
  tablesOccupied: number;
  pendingReservations: number;
}

export function StatsCards({
  todayOrders,
  todayRevenue,
  tablesOccupied,
  pendingReservations,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Today's Orders",
      value: todayOrders.toString(),
      icon: ShoppingCart,
      description: "Total orders placed today",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Today's Revenue",
      value: formatPrice(todayRevenue),
      icon: IndianRupee,
      description: "Revenue generated today",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Tables Occupied",
      value: tablesOccupied.toString(),
      icon: Armchair,
      description: "Currently occupied tables",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Pending Reservations",
      value: pendingReservations.toString(),
      icon: CalendarDays,
      description: "Upcoming reservations",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-md ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
