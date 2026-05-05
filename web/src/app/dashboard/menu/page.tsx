"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { MenuCategory, MenuItem } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function MenuManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data } = await api.get("/menu/categories");
      return data.data;
    },
  });

  const { data: items = [] } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data } = await api.get("/menu/items");
      return data.data;
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      await api.patch(`/menu/items/${id}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Item updated" });
    },
  });

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">{items.length} items across {categories.length} categories</p>
        </div>
      </div>

      <Input
        placeholder="Search menu items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category?.name || "-"}</TableCell>
                      <TableCell className="font-medium">{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={item.isVeg ? "default" : "destructive"} className="text-xs">
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })
                          }
                        >
                          {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {cat.name}
                    <Badge variant={cat.isActive ? "default" : "secondary"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{cat.description || "No description"}</p>
                  <p className="text-sm mt-2">{cat.items?.length || 0} items</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
