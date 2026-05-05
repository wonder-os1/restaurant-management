"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, OrderType } from "@/types";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  SERVED: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const { data } = await api.get(`/orders?${params}`);
      return data.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">{orders.length} orders found</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="SERVED">Served</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DINE_IN">Dine In</SelectItem>
            <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
            <SelectItem value="DELIVERY">Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">#{order.id.slice(-6)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.type.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[order.status])}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
