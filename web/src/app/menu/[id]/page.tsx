"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, UtensilsCrossed, Leaf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { formatPrice } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";
import api from "@/lib/api";
import { MenuItem } from "@/types";

export default function MenuItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: item, isLoading } = useQuery({
    queryKey: ["menu-item", id],
    queryFn: async () => {
      const { data } = await api.get<MenuItem>(`/menu/items/${id}`);
      return data;
    },
  });

  const { data: relatedItems } = useQuery({
    queryKey: ["related-items", item?.categoryId],
    queryFn: async () => {
      const { data } = await api.get<MenuItem[]>(
        `/menu/items?categoryId=${item!.categoryId}&limit=4`
      );
      return data.filter((i) => i.id !== id);
    },
    enabled: !!item?.categoryId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/4 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-10 w-1/3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The menu item you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/menu")}>Back to Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed className="h-24 w-24 text-orange-300" />
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`mt-1 w-6 h-6 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  item.isVeg ? "border-green-600" : "border-red-600"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    item.isVeg ? "bg-green-600" : "bg-red-600"
                  }`}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{item.name}</h1>
                {item.category && (
                  <Badge variant="outline" className="mt-1">
                    {item.category.name}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-3xl font-bold text-primary mb-4">
              {formatPrice(item.price)}
            </p>

            {item.description && (
              <p className="text-muted-foreground mb-6">{item.description}</p>
            )}

            <div className="flex items-center gap-3 mb-6">
              <Badge
                className={
                  item.isVeg
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {item.isVeg ? (
                  <>
                    <Leaf className="mr-1 h-3 w-3" /> Vegetarian
                  </>
                ) : (
                  "Non-Vegetarian"
                )}
              </Badge>
              <Badge
                className={
                  item.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>

            <Separator className="my-6" />

            {isFeatureEnabled("onlineOrdering") && item.isAvailable && (
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Order
              </Button>
            )}

            {!item.isAvailable && (
              <p className="text-muted-foreground italic">
                This item is currently unavailable. Please check back later.
              </p>
            )}
          </div>
        </div>

        {/* Related Items */}
        {relatedItems && relatedItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.slice(0, 4).map((relItem) => (
                <Card
                  key={relItem.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/menu/${relItem.id}`)}
                >
                  <div className="relative h-40 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    {relItem.image ? (
                      <img
                        src={relItem.image}
                        alt={relItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="h-8 w-8 text-orange-300" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">{relItem.name}</h3>
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatPrice(relItem.price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
