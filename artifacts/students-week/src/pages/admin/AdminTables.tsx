import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  useGetTables, getGetTablesQueryKey,
  useCreateTable, useUpdateTable, useDeleteTable,
  useGetOrdersByTable, getGetOrdersByTableQueryKey,
  useUpdateOrderStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, QrCode, Search, Download, CheckCheck, Clock, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { EventTable, TableOrderGroup, OrderFull } from "@workspace/api-client-react";

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
});

function getTableUrl(tableNumber: string) {
  const base = window.location.origin + (import.meta.env.BASE_URL ?? "/");
  return `${base.replace(/\/$/, "")}/?table=${encodeURIComponent(tableNumber)}`;
}

export default function AdminTables() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EventTable | null>(null);
  const [selectedTableGroup, setSelectedTableGroup] = useState<TableOrderGroup | null>(null);
  const [qrTarget, setQrTarget] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useGetTables({}, { query: { queryKey: getGetTablesQueryKey({}), refetchInterval: 10000 } });
  const { data: ordersByTable, refetch: refetchOrders } = useGetOrdersByTable({
    query: { queryKey: getGetOrdersByTableQueryKey(), refetchInterval: 15000 },
  });

  const handleReload = async () => {
    setIsReloading(true);
    await Promise.all([refetchTables(), refetchOrders()]);
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const updateStatus = useUpdateOrderStatus();

  const form = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: { tableNumber: "" },
  });

  const filteredTables = (tables ?? []).filter(t =>
    !search || t.tableNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getOrdersForTable = (tableNumber: string) =>
    ordersByTable?.find(g => g.tableNumber === tableNumber) ?? null;

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateTable.mutate(
      { id, data: { isActive } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTablesQueryKey() }) }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteTable.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTablesQueryKey() });
          toast({ title: "Table deleted" });
          setDeleteTarget(null);
        },
      }
    );
  };

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

  const handleOpenQR = async (tableNumber: string) => {
    setQrTarget(tableNumber);
    setQrDataUrl(null);
    const url = getTableUrl(tableNumber);
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
    setQrDataUrl(dataUrl);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !qrTarget) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `table-${qrTarget}-qr.png`;
    a.click();
  };

  const onAddTable = (values: z.infer<typeof tableSchema>) => {
    createTable.mutate(
      { data: { tableNumber: values.tableNumber.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTablesQueryKey() });
          toast({ title: "Table added" });
          form.reset();
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Table Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage tables, generate QR codes, and view per-table orders.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleReload} 
            disabled={isReloading} 
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`} />
            Reload
          </Button>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddTable)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="e.g. A1"
                        className="bg-background/50 border-primary/20 text-white w-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createTable.isPending} className="bg-primary hover:bg-primary/90">
                {createTable.isPending ? "Adding..." : "Add Table"}
              </Button>
            </form>
          </Form>
        </div>
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
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        className="p-1 text-zinc-400 hover:text-primary transition-colors"
                        title="Generate QR"
                        onClick={() => handleOpenQR(table.tableNumber)}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete table"
                        onClick={() => setDeleteTarget(table)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

                  <div
                    className="flex items-center gap-1 mt-1"
                    onClick={e => { e.stopPropagation(); handleToggleActive(table.id, !table.isActive); }}
                  >
                    <Switch checked={table.isActive} className="scale-75 origin-left" />
                    <span className="text-xs text-zinc-500">{table.isActive ? "Active" : "Off"}</span>
                  </div>
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

      {/* QR Code dialog */}
      <Dialog open={!!qrTarget} onOpenChange={open => !open && (setQrTarget(null), setQrDataUrl(null))}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>QR Code — Table {qrTarget}</DialogTitle>
          </DialogHeader>
          {qrDataUrl ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                <img src={qrDataUrl} alt={`QR for table ${qrTarget}`} className="w-48 h-48" />
              </div>
              <p className="text-xs text-zinc-400 break-all">{getTableUrl(qrTarget ?? "")}</p>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleDownloadQR}>
                <Download className="h-4 w-4 mr-2" /> Download PNG
              </Button>
            </div>
          ) : (
            <div className="py-8 text-zinc-400">Generating QR code...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-primary/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete table?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Delete table "<strong className="text-white">{deleteTarget?.tableNumber}</strong>"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete} disabled={deleteTable.isPending}>
              {deleteTable.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
