"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import type { DashboardStats, Order } from "@/types";

export default function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data.data;
    },
  });

  const { data: recentOrders = [] } = useQuery<Order[]>({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders?limit=10&sort=createdAt:desc");
      return data.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant today</p>
      </div>
      <StatsCards stats={stats} />
      <RecentOrders orders={recentOrders} />
    </div>
  );
}
