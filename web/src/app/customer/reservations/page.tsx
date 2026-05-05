"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Reservation, ReservationStatus } from "@/types";

const statusColors: Record<ReservationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SEATED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function CustomerReservationsPage() {
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const { data } = await api.get("/reservations/my");
      return data.data;
    },
  });

  const upcoming = reservations.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );
  const past = reservations.filter(
    (r) => r.status === "COMPLETED" || r.status === "CANCELLED"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Reservations</h1>
        <Link href="/reserve">
          <Button>New Reservation</Button>
        </Link>
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.time} • {r.partySize} guest{r.partySize > 1 ? "s" : ""}
                      </p>
                      {r.table && (
                        <p className="text-sm text-muted-foreground">Table #{r.table.number}</p>
                      )}
                      {r.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">{r.notes}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-muted-foreground">Past</h2>
          <div className="space-y-2">
            {past.map((r) => (
              <Card key={r.id} className="opacity-70">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {new Date(r.date).toLocaleDateString("en-IN")} at {r.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.partySize} guest{r.partySize > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant={r.status === "COMPLETED" ? "default" : "destructive"}>
                    {r.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {reservations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No reservations yet</p>
            <Link href="/reserve">
              <Button className="mt-4">Make a Reservation</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
