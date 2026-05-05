"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Reservation, ReservationStatus } from "@/types";

const statusColors: Record<ReservationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SEATED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ReservationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data } = await api.get("/reservations");
      return data.data;
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      await api.patch(`/reservations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast({ title: "Reservation updated" });
    },
  });

  const today = reservations.filter(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );
  const upcoming = reservations.filter(
    (r) => new Date(r.date) > new Date() && new Date(r.date).toDateString() !== new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-muted-foreground">{today.length} today, {upcoming.length} upcoming</p>
      </div>

      <h2 className="text-lg font-semibold">Today</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {today.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.guestName}</TableCell>
                  <TableCell>{r.guestPhone}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>{r.partySize}</TableCell>
                  <TableCell>{r.table ? `#${r.table.number}` : "Unassigned"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "CONFIRMED" })}>
                          Confirm
                        </Button>
                      )}
                      {r.status === "CONFIRMED" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "SEATED" })}>
                          Seat
                        </Button>
                      )}
                      {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "CANCELLED" })}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {today.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No reservations today</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Party Size</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.slice(0, 20).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.guestName}</TableCell>
                      <TableCell>{new Date(r.date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>{r.time}</TableCell>
                      <TableCell>{r.partySize}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
