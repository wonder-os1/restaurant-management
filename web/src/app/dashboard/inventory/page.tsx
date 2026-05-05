"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Inventory } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function InventoryPage() {
  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await api.get("/inventory");
      return data.data;
    },
  });

  const lowStock = inventory.filter((i) => i.quantity <= i.minQuantity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          {inventory.length} items tracked, {lowStock.length} low stock
        </p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-medium text-red-800">Low Stock Alert</p>
          <p className="text-sm text-red-600 mt-1">
            {lowStock.map((i) => i.name).join(", ")} need restocking
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min. Required</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minQuantity;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className={isLow ? "text-red-600 font-medium" : ""}>
                      {item.quantity}
                    </TableCell>
                    <TableCell>{item.minQuantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatPrice(item.costPerUnit)}</TableCell>
                    <TableCell>{item.supplier?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={isLow ? "destructive" : "default"}>
                        {isLow ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No inventory items
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
