"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { KitchenOrder, KitchenOrderStatus } from "@/types";

const statusConfig: Record<KitchenOrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "border-yellow-400 bg-yellow-50" },
  IN_PROGRESS: { label: "In Progress", color: "border-blue-400 bg-blue-50" },
  READY: { label: "Ready", color: "border-green-400 bg-green-50" },
  SERVED: { label: "Served", color: "border-gray-300 bg-gray-50" },
};

export default function KitchenDisplayPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kitchenOrders = [] } = useQuery<KitchenOrder[]>({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen");
      return data.data;
    },
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: KitchenOrderStatus }) => {
      await api.patch(`/kitchen/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast({ title: "Kitchen order updated" });
    },
  });

  const pending = kitchenOrders.filter((k) => k.status === "PENDING");
  const inProgress = kitchenOrders.filter((k) => k.status === "IN_PROGRESS");
  const ready = kitchenOrders.filter((k) => k.status === "READY");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <p className="text-muted-foreground">
          {pending.length} pending, {inProgress.length} cooking, {ready.length} ready
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-yellow-700">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((ko) => (
              <KitchenCard
                key={ko.id}
                order={ko}
                onAdvance={() => updateStatus.mutate({ id: ko.id, status: "IN_PROGRESS" })}
                actionLabel="Start Cooking"
              />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-blue-700">In Progress ({inProgress.length})</h2>
          <div className="space-y-3">
            {inProgress.map((ko) => (
              <KitchenCard
                key={ko.id}
                order={ko}
                onAdvance={() => updateStatus.mutate({ id: ko.id, status: "READY" })}
                actionLabel="Mark Ready"
              />
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-green-700">Ready ({ready.length})</h2>
          <div className="space-y-3">
            {ready.map((ko) => (
              <KitchenCard
                key={ko.id}
                order={ko}
                onAdvance={() => updateStatus.mutate({ id: ko.id, status: "SERVED" })}
                actionLabel="Mark Served"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KitchenCard({
  order,
  onAdvance,
  actionLabel,
}: {
  order: KitchenOrder;
  onAdvance: () => void;
  actionLabel: string;
}) {
  const config = statusConfig[order.status];
  const elapsed = order.startedAt
    ? Math.round((Date.now() - new Date(order.startedAt).getTime()) / 60000)
    : 0;

  return (
    <Card className={cn("border-l-4", config.color)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Order #{order.orderId.slice(-6)}</CardTitle>
          {order.priority > 0 && <Badge variant="destructive" className="text-xs">Priority</Badge>}
        </div>
        {elapsed > 0 && (
          <p className={cn("text-xs", elapsed > 20 ? "text-red-600 font-medium" : "text-muted-foreground")}>
            {elapsed} min ago
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 mb-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-medium">x{item.quantity}</span>
            </li>
          ))}
        </ul>
        <Button size="sm" className="w-full" onClick={onAdvance}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
