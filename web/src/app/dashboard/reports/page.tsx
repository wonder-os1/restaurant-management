"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

export default function ReportsPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Business insights and performance data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.revenueByDay?.length ? (
              <div className="space-y-2">
                {stats.revenueByDay.map((day) => {
                  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue));
                  const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">
                        {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          <span className="text-xs text-primary-foreground font-medium">
                            {formatPrice(day.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No revenue data</p>
            )}
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.popularItems?.length ? (
              <div className="space-y-3">
                {stats.popularItems.slice(0, 10).map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count} orders</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No order data</p>
            )}
          </CardContent>
        </Card>

        {/* Orders by Hour */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ordersByHour?.length ? (
              <div className="flex items-end gap-1 h-40">
                {Array.from({ length: 24 }, (_, hour) => {
                  const entry = stats.ordersByHour.find((h) => h.hour === hour);
                  const count = entry?.count || 0;
                  const max = Math.max(...stats.ordersByHour.map((h) => h.count));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <div
                          className="w-full bg-primary/80 rounded-t"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                          title={`${hour}:00 - ${count} orders`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {hour % 3 === 0 ? `${hour}h` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No peak hour data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
