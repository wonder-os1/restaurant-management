"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"];

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order } = useQuery<Order>({
    queryKey: ["my-order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data;
    },
    refetchInterval: 10000,
  });

  if (!order) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
        <p className="text-muted-foreground">
          {new Date(order.createdAt).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Status tracker */}
      {order.status !== "CANCELLED" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Order Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, idx) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx <= currentStep ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <Badge variant="destructive">Cancelled</Badge>
        </div>
      )}

      {/* Order items */}
      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
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
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment info */}
      <Card>
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Payment</span>
          <div className="flex gap-2 items-center">
            <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"}>
              {order.paymentStatus}
            </Badge>
            {order.paymentMethod && (
              <span className="text-sm text-muted-foreground">{order.paymentMethod}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
