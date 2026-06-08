import { useState } from "react";
import {
  useGetTables, getGetTablesQueryKey,
  useGetOrdersByTable, getGetOrdersByTableQueryKey,
  useUpdateOrderStatus,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, CheckCheck, Clock, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { TableOrderGroup, OrderFull } from "@workspace/api-client-react";

export default function UsherTables() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedTableGroup, setSelectedTableGroup] = useState<TableOrderGroup | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useGetTables({}, { query: { queryKey: getGetTablesQueryKey({}), refetchInterval: 10000 } });
  const { data: ordersByTable, refetch: refetchOrders } = useGetOrdersByTable({
    query: { queryKey: getGetOrdersByTableQueryKey(), refetchInterval: 15000 },
  });

  const updateStatus = useUpdateOrderStatus();

  const handleReload = async () => {
    setIsReloading(true);
    await Promise.all([refetchTables(), refetchOrders()]);
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  const filteredTables = (tables ?? []).filter(t =>
    !search || t.tableNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getOrdersForTable = (tableNumber: string) =>
    ordersByTable?.find(g => g.tableNumber === tableNumber) ?? null;

  const handleMarkServed = (orderId: number) => {
    updateStatus.mutate(
      { id: orderId, data: { status: "served" } },
      {
        onSuccess: () => {
          refetchOrders();
          if (selectedTableGroup) {
            setSelectedTableGroup(prev =>
              prev
                ? {
                    ...prev,
                    orders: prev.orders.map(o =>
                      o.id === orderId ? { ...o, status: "served" as const } : o
                    ),
                    pendingCount: Math.max(0, prev.pendingCount - 1),
                    servedCount: prev.servedCount + 1,
                  }
                : prev
            );
          }
        },
      }
    );
  };

  const handleMarkAllServed = () => {
    if (!selectedTableGroup) return;
    const pending = selectedTableGroup.orders.filter(o => o.status === "pending");
    pending.forEach(o => handleMarkServed(o.id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tables</h2>
          <p className="text-muted-foreground mt-1">View per-table orders.</p>
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

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tables..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/50 border-primary/20 text-white"
        />
      </div>

      {/* Grid of table cards */}
      {tablesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card/30 border border-primary/10 animate-pulse" />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 bg-card/30 rounded-xl border border-primary/10">
          {search ? "No tables match your search." : "No tables configured yet."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTables.map(table => {
            const group = getOrdersForTable(table.tableNumber);
            const pending = group?.pendingCount ?? 0;
            const served = group?.servedCount ?? 0;
            const total = group?.totalOrders ?? 0;
            return (
              <Card
                key={table.id}
                className={`relative bg-card/40 border transition-all cursor-pointer hover:border-primary/50 hover:bg-card/60 ${
                  table.isActive ? "border-primary/15" : "border-zinc-700/40 opacity-60"
                }`}
                onClick={() => {
                  const g = getOrdersForTable(table.tableNumber);
                  if (g) setSelectedTableGroup(g);
                  else setSelectedTableGroup({ tableNumber: table.tableNumber, totalOrders: 0, pendingCount: 0, servedCount: 0, orders: [] });
                }}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-white text-lg leading-none">{table.tableNumber}</span>
                  </div>

                  {total > 0 ? (
                    <div className="space-y-1">
                      {pending > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <Clock className="h-3 w-3" /> {pending} pending
                        </div>
                      )}
                      {served > 0 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCheck className="h-3 w-3" /> {served} served
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600">No orders</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table order detail dialog */}
      <Dialog open={!!selectedTableGroup} onOpenChange={open => !open && setSelectedTableGroup(null)}>
        <DialogContent className="bg-card border-primary/20 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Table {selectedTableGroup?.tableNumber} — Orders</span>
              <div className="flex gap-2 text-sm font-normal">
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                  {selectedTableGroup?.pendingCount} pending
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {selectedTableGroup?.servedCount} served
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTableGroup && selectedTableGroup.pendingCount > 0 && (
            <Button
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white mb-2"
              onClick={handleMarkAllServed}
            >
              <CheckCheck className="h-4 w-4 mr-2" /> Mark all pending as served
            </Button>
          )}

          <div className="space-y-3">
            {selectedTableGroup?.orders.length === 0 && (
              <div className="py-8 text-center text-zinc-500">No orders for this table yet.</div>
            )}
            {selectedTableGroup?.orders.map((order: OrderFull) => (
              <div
                key={order.id}
                className="bg-background/40 border border-primary/10 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-white">{order.customerName}</div>
                    <div className="text-xs text-zinc-400">{order.vendorName} · {order.mainDishTypeName ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {order.status}
                    </span>
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600"
                        onClick={() => handleMarkServed(order.id)}
                        disabled={updateStatus.isPending}
                      >
                        Serve
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {order.sides.map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs border-primary/15 text-zinc-300 font-normal">
                      {s.sideName}
                      {s.isComplementary && <span className="ml-1 text-primary/60">✓</span>}
                    </Badge>
                  ))}
                  {order.proteins.map(p => (
                    <Badge key={p.id} variant="outline" className="text-xs border-amber-500/20 text-amber-200/70 font-normal">
                      {p.proteinName}
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-zinc-500">{format(new Date(order.createdAt), "dd MMM, HH:mm")}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
