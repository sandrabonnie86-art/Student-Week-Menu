import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useGetVendorDashboardStats, getGetVendorDashboardStatsQueryKey } from "@workspace/api-client-react";
import { RefreshCw } from "lucide-react";

export default function VendorDashboard() {
  const vendorId = Number(localStorage.getItem("vendorId"));
  const vendorName = localStorage.getItem("vendorName");
  const [, setLocation] = useLocation();
  const [isReloading, setIsReloading] = useState(false);

  const { data: stats, refetch } = useGetVendorDashboardStats(
    vendorId,
    { query: { enabled: !!vendorId, refetchInterval: 10000, queryKey: getGetVendorDashboardStatsQueryKey(vendorId) } }
  );

  useEffect(() => {
    const authenticated = localStorage.getItem("vendorAuthenticated") === "true";
    if (!authenticated) {
      setLocation(ROUTES.VENDOR_LOGIN);
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("vendorAuthenticated");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("vendorName");
    setLocation(ROUTES.VENDOR_LOGIN);
  };

  const handleReload = async () => {
    setIsReloading(true);
    await refetch();
    setIsReloading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{vendorName}</h1>
          <p className="text-muted-foreground mt-1">Vendor Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReload}
            disabled={isReloading}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`} />
            Reload
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-primary/20 text-white hover:bg-white/5"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/40 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats?.totalOrders ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">{stats?.pendingOrders ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Served Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">{stats?.servedOrders ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Plates Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats?.remainingPlates === -1 ? "∞" : stats?.remainingPlates ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/40 border-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Popular Main Dishes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.popularMainDishes?.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {stats?.popularMainDishes?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white">{item.name}</span>
                    <span className="text-muted-foreground font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Popular Main Dish Types</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.popularMainDishTypes?.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {stats?.popularMainDishTypes?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white">{item.name}</span>
                    <span className="text-muted-foreground font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Popular Sides</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.popularSides?.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {stats?.popularSides?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white">{item.name}</span>
                    <span className="text-muted-foreground font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Popular Proteins</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.popularProteins?.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {stats?.popularProteins?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white">{item.name}</span>
                    <span className="text-muted-foreground font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
