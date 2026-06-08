import { useState } from "react";
import { useGetOrderHistory, getGetOrderHistoryQueryKey, useGetVendors, getGetVendorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [isReloading, setIsReloading] = useState(false);
  const { toast } = useToast();

  const { data: vendors, refetch: refetchVendors } = useGetVendors({}, { query: { queryKey: getGetVendorsQueryKey({}), refetchInterval: 10000 } });

  const params: Record<string, unknown> = {};
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;
  if (vendorFilter !== "all") params.vendorId = Number(vendorFilter);

  const { data: orders, isLoading, refetch: refetchOrders } = useGetOrderHistory(
    params,
    { query: { queryKey: getGetOrderHistoryQueryKey(params), refetchInterval: 10000 } }
  );

  const handleReload = async () => {
    setIsReloading(true);
    await Promise.all([refetchVendors(), refetchOrders()]);
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Order History</h2>
          <p className="text-muted-foreground mt-1">Search and filter all orders from the event.</p>
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

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-primary/20 text-white placeholder:text-muted-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-background/50 border-primary/20 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="served">Served</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-44 bg-background/50 border-primary/20 text-white">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors?.map((v) => (
              <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-zinc-500 -mt-4">
        {orders ? `${orders.length} order${orders.length !== 1 ? "s" : ""} found` : "Loading..."}
      </div>

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
                <th className="px-4 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading...</td>
                </tr>
              )}
              {!isLoading && orders?.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-mono text-zinc-400 text-xs">#{order.id.toString().padStart(4, "0")}</td>
                  <td className="px-4 py-4 font-medium text-white">{order.customerName}</td>
                  <td className="px-4 py-4 text-zinc-300">{order.tableNumber}</td>
                  <td className="px-4 py-4 text-zinc-300">{order.vendorName}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {order.mainDishTypeName && (
                        <div className="text-white text-xs font-medium">{order.mainDishTypeName}</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {order.sides.map((s) => (
                          <Badge key={s.id} variant="outline" className="text-xs border-primary/10 text-zinc-400 font-normal">
                            {s.sideName}
                          </Badge>
                        ))}
                        {order.proteins.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs border-amber-500/20 text-amber-200/70 font-normal">
                            {p.proteinName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-400 whitespace-nowrap text-xs">
                    {format(new Date(order.createdAt), "dd MMM, HH:mm")}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && orders?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
