"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, UtensilsCrossed, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import { MenuCategory, MenuItem } from "@/types";

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data } = await api.get<MenuCategory[]>("/menu/categories");
      return data;
    },
  });

  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ["menu-items", selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== "all" ? `?categoryId=${selectedCategory}` : "";
      const { data } = await api.get<MenuItem[]>(`/menu/items${params}`);
      return data;
    },
  });

  const filteredItems = (menuItems || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg =
      vegFilter === "all" ||
      (vegFilter === "veg" && item.isVeg) ||
      (vegFilter === "nonveg" && !item.isVeg);
    return matchesSearch && matchesVeg;
  });

  const isLoading = categoriesLoading || menuLoading;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Our Menu</h1>
          <p className="text-muted-foreground">
            Explore our carefully curated selection of dishes
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={vegFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setVegFilter("all")}
            >
              All
            </Button>
            <Button
              variant={vegFilter === "veg" ? "default" : "outline"}
              size="sm"
              onClick={() => setVegFilter("veg")}
              className={vegFilter === "veg" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Leaf className="mr-1 h-3 w-3" />
              Veg
            </Button>
            <Button
              variant={vegFilter === "nonveg" ? "default" : "outline"}
              size="sm"
              onClick={() => setVegFilter("nonveg")}
              className={vegFilter === "nonveg" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Non-Veg
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {(categories || []).map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-100 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 bg-gray-100 animate-pulse rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-100 animate-pulse rounded mb-2" />
                  <div className="h-6 bg-gray-100 animate-pulse rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/menu/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="h-12 w-12 text-orange-300" />
                    )}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                          item.isVeg
                            ? "border-green-600"
                            : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                    </div>
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Unavailable</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-2">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.category && (
                      <Badge variant="outline" className="mt-2">
                        {item.category.name}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
