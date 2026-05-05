"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isFeatureEnabled } from "@/lib/features";

export default function SettingsPage() {
  const { data: settings = [] } = useQuery<Array<{ key: string; value: string; type: string }>>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return data.data;
    },
  });

  const features = [
    { key: "onlineOrdering", label: "Online Ordering" },
    { key: "tableReservation", label: "Table Reservations" },
    { key: "kitchenDisplay", label: "Kitchen Display System" },
    { key: "inventoryManagement", label: "Inventory Management" },
    { key: "loyaltyProgram", label: "Loyalty Program" },
    { key: "deliveryTracking", label: "Delivery Tracking" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Restaurant configuration and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.length > 0 ? (
            <div className="space-y-3">
              {settings.map((s) => (
                <div key={s.key} className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">{s.key.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">{s.type}</p>
                  </div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {typeof s.value === "string" ? s.value.slice(0, 50) : JSON.stringify(s.value).slice(0, 50)}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No custom settings configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.key} className="flex justify-between items-center py-2">
                <span className="font-medium">{f.label}</span>
                <Badge variant={isFeatureEnabled(f.key) ? "default" : "secondary"}>
                  {isFeatureEnabled(f.key) ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing Restaurant"} — Powered by Wonder OS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
