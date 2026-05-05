"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Bill } from "@/types";

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function BillingPage() {
  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data } = await api.get("/bills");
      return data.data;
    },
  });

  const todayRevenue = bills
    .filter((b) => b.paymentStatus === "PAID" && new Date(b.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, b) => sum + b.total, 0);

  const pendingPayments = bills.filter((b) => b.paymentStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Payments</h1>
        <p className="text-muted-foreground">
          Today&apos;s revenue: {formatPrice(todayRevenue)} | {pendingPayments} pending
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-mono text-sm">#{bill.id.slice(-6)}</TableCell>
                  <TableCell className="font-mono text-sm">#{bill.orderId.slice(-6)}</TableCell>
                  <TableCell>{bill.customer?.user?.name || "-"}</TableCell>
                  <TableCell>{formatPrice(bill.amount)}</TableCell>
                  <TableCell>{formatPrice(bill.tax)}</TableCell>
                  <TableCell>{bill.discount > 0 ? `-${formatPrice(bill.discount)}` : "-"}</TableCell>
                  <TableCell className="font-medium">{formatPrice(bill.total)}</TableCell>
                  <TableCell>{bill.paymentMethod || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={bill.paymentStatus === "PAID" ? "default" : bill.paymentStatus === "FAILED" ? "destructive" : "secondary"}>
                      {bill.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No bills found
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
