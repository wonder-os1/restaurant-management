"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function CustomerOrdersPage() {
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders/my");
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <Link href="/menu">
              <Button className="mt-4">Browse Menu</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/customer/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.items.length} items • {order.type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(order.total)}</p>
                      <Badge
                        variant={
                          order.status === "SERVED" || order.status === "DELIVERED"
                            ? "default"
                            : order.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="mt-1"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
