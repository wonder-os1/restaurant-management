"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  CalendarDays,
  Star,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { isFeatureEnabled } from "@/lib/features";
import { formatPrice, formatDateTime, getOrderStatusColor } from "@/lib/utils";
import api from "@/lib/api";
import { Order, Customer } from "@/types";

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();

  const { data: recentOrders } = useQuery({
    queryKey: ["customer-recent-orders"],
    queryFn: async () => {
      const { data } = await api.get<Order[]>("/orders/my?limit=5");
      return data;
    },
  });

  const { data: customerProfile } = useQuery({
    queryKey: ["customer-profile"],
    queryFn: async () => {
      const { data } = await api.get<Customer>("/customers/me");
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here is a quick overview of your activity
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentOrders?.length || 0}
            </div>
          </CardContent>
        </Card>

        {isFeatureEnabled("loyaltyProgram") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Loyalty Points
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customerProfile?.loyaltyPoints || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Points earned from orders
              </p>
            </CardContent>
          </Card>
        )}

        {isFeatureEnabled("tableReservation") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reservations
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/reserve">Book a Table</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest order activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/customer/orders">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start exploring our menu and place your first order!
              </p>
              <Button asChild>
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-50 p-2 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(order.total)}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
