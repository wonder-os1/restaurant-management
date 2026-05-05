"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data;
    },
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: OrderStatus) => {
      await api.patch(`/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast({ title: "Order status updated" });
    },
  });

  if (!order) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const next = nextStatus[order.status];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
          <p className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          {next && (
            <Button onClick={() => updateStatus.mutate(next)} disabled={updateStatus.isPending}>
              Mark as {next.replace("_", " ")}
            </Button>
          )}
          {order.status !== "CANCELLED" && order.status !== "SERVED" && order.status !== "DELIVERED" && (
            <Button
              variant="destructive"
              onClick={() => updateStatus.mutate("CANCELLED")}
              disabled={updateStatus.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Type</CardTitle></CardHeader>
          <CardContent><Badge variant="outline">{order.type.replace("_", " ")}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent><Badge>{order.status}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Payment</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"}>
              {order.paymentStatus}
            </Badge>
            {order.paymentMethod && (
              <span className="ml-2 text-sm text-muted-foreground">{order.paymentMethod}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {order.table && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Table</CardTitle></CardHeader>
          <CardContent>Table #{order.table.number} ({order.table.section || "Main"})</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{order.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
