import { useState } from "react";
import { useGetOrders, getGetOrdersQueryKey, useGetOrderSummary, getGetOrderSummaryQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UsherLiveOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isReloading, setIsReloading] = useState(false);

  const { data: summary, refetch: refetchSummary } = useGetOrderSummary({
    query: { queryKey: getGetOrderSummaryQueryKey(), refetchInterval: 10000 }
  });

  const { data: orders, refetch: refetchOrders } = useGetOrders(
    { status: "pending", ...(search ? { search } : {}) },
    { query: { queryKey: getGetOrdersQueryKey({ status: "pending", search: search || undefined }), refetchInterval: 10000 } }
  );

  const updateStatus = useUpdateOrderStatus();

  const handleMarkServed = (orderId: number) => {
    updateStatus.mutate(
      { id: orderId, data: { status: "served" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrderSummaryQueryKey() });
          toast({ title: "Order marked as served" });
        },
        onError: () => toast({ title: "Failed to update order", variant: "destructive" })
      }
    );
  };

  const handleReload = async () => {
    setIsReloading(true);
    await Promise.all([refetchSummary(), refetchOrders()]);
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Live Orders</h2>
          <p className="text-muted-foreground mt-1">Pending orders — mark them as served when delivered.</p>
        </div>
        <Button 
          onClick={handleReload} 
          disabled={isReloading} 
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total", value: summary?.total ?? 0, color: "text-white" },
          { label: "Pending", value: summary?.pending ?? 0, color: "text-yellow-400" },
          { label: "Served", value: summary?.served ?? 0, color: "text-green-400" },
        ].map(stat => (
          <Card key={stat.label} className="bg-card/40 border-primary/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or table..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/50 border-primary/20 text-white placeholder:text-muted-foreground"
        />
      </div>

      {/* Orders table */}
      <div className="bg-card/40 border border-primary/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 bg-background/50 border-b border-primary/10 uppercase">
              <tr>
                <th className="px-4 py-4 font-medium">#</th>
                <th className="px-4 py-4 font-medium">Customer</th>
                <th className="px-4 py-4 font-medium">Table</th>
                <th className="px-4 py-4 font-medium">Vendor</th>
                <th className="px-4 py-4 font-medium">Order</th>
                <th className="px-4 py-4 font-medium">Time</th>
                <th className="px-4 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {orders?.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-mono text-zinc-400 text-xs">#{order.id.toString().padStart(4, "0")}</td>
                  <td className="px-4 py-4 font-medium text-white">{order.customerName}</td>
                  <td className="px-4 py-4 text-zinc-300">{order.tableNumber}</td>
                  <td className="px-4 py-4 text-zinc-300">{order.vendorName}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      {order.mainDishTypeName && (
                        <div className="text-white text-xs font-medium">{order.mainDishTypeName}</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.sides.map(s => (
                          <Badge key={s.id} variant="outline" className="text-xs bg-background/50 border-primary/10 text-zinc-300 font-normal">
                            {s.sideName}
                            {s.isComplementary && <span className="ml-1 text-primary text-[10px]">★</span>}
                          </Badge>
                        ))}
                        {order.proteins.map(p => (
                          <Badge key={p.id} variant="outline" className="text-xs bg-background/50 border-amber-500/20 text-amber-200/70 font-normal">
                            {p.proteinName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-400 whitespace-nowrap text-xs">
                    {format(new Date(order.createdAt), "HH:mm")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {order.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => handleMarkServed(order.id)}
                        disabled={updateStatus.isPending}
                        className="bg-green-700 hover:bg-green-600 text-white text-xs h-8 px-3"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Served
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-500 bg-zinc-500/10 px-2 py-1 rounded">Served</span>
                    )}
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    {search ? "No orders match your search." : "No pending orders."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
