"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Table as TableType, TableStatus } from "@/types";

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: "Available", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  OCCUPIED: { label: "Occupied", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  RESERVED: { label: "Reserved", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  MAINTENANCE: { label: "Maintenance", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function TablesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables = [] } = useQuery<TableType[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const { data } = await api.get("/tables");
      return data.data;
    },
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TableStatus }) => {
      await api.patch(`/tables/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({ title: "Table status updated" });
    },
  });

  const sections = [...new Set(tables.map((t) => t.section || "Main"))];
  const stats = {
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    total: tables.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Table Management</h1>
        <p className="text-muted-foreground">
          {stats.available} available, {stats.occupied} occupied, {stats.reserved} reserved
        </p>
      </div>

      {sections.map((section) => (
        <div key={section}>
          <h2 className="text-lg font-semibold mb-3">{section}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables
              .filter((t) => (t.section || "Main") === section)
              .sort((a, b) => a.number - b.number)
              .map((table) => {
                const config = statusConfig[table.status];
                return (
                  <Card key={table.id} className={cn("border-2 cursor-pointer transition-all hover:shadow-md", config.bg)}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{table.number}</p>
                      <p className={cn("text-xs font-medium mt-1", config.color)}>{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{table.capacity} seats</p>
                      {table.status === "AVAILABLE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full text-xs"
                          onClick={() => updateStatus.mutate({ id: table.id, status: "OCCUPIED" })}
                        >
                          Seat Guest
                        </Button>
                      )}
                      {table.status === "OCCUPIED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full text-xs"
                          onClick={() => updateStatus.mutate({ id: table.id, status: "AVAILABLE" })}
                        >
                          Free Table
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
