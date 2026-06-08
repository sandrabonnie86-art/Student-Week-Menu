import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useGetOrderSummary, getGetOrderSummaryQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem("adminAuthenticated") === "true";
    if (!authenticated) {
      setLocation(ROUTES.ADMIN_LOGIN);
    }
  }, [setLocation]);

  const { data: summary } = useGetOrderSummary({
    query: { queryKey: getGetOrderSummaryQueryKey(), refetchInterval: 10000 }
  });

  const navItems = [
    { href: ROUTES.ADMIN_DASHBOARD, label: "Live Orders" },
    { href: ROUTES.ADMIN_VENDORS, label: "Vendors" },
    { href: ROUTES.ADMIN_TABLES, label: "Tables" },
    { href: ROUTES.ADMIN_MENU, label: "Menu Items" },
    { href: ROUTES.ADMIN_HISTORY, label: "Order History" },
    { href: ROUTES.ADMIN_CONFIG, label: "Configuration" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setLocation(ROUTES.ADMIN_LOGIN);
  };

  const renderNavItems = () => (
    <nav className="flex flex-col gap-2">
      {navItems.map(item => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsDrawerOpen(false)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-between",
              isActive
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <span>{item.label}</span>
            {item.href === ROUTES.ADMIN_DASHBOARD && (summary?.pending ?? 0) > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full ml-2">
                {summary?.pending}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-primary/20 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-card border-primary/20 text-white p-6">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-xs text-primary mt-1">Students Week 2026</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            {renderNavItems()}
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-white">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          {summary?.pending && summary.pending > 0 && (
            <div className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full font-medium">
              {summary.pending} Pending
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-primary/20 bg-card/50 backdrop-blur-md flex-shrink-0 h-[100dvh] sticky top-0 flex-col">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-primary mt-1">Students Week 2026</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-4 flex-1">
          {renderNavItems()}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto z-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
