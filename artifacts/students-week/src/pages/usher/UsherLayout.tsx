import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: ROUTES.USHER_DASHBOARD, label: "Live Orders" },
  { href: ROUTES.USHER_TABLES, label: "Tables" },
];

export default function UsherLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem("usherAuthenticated") === "true";
    if (!authenticated) {
      setLocation(ROUTES.USHER_LOGIN);
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("usherAuthenticated");
    setLocation(ROUTES.USHER_LOGIN);
  };

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
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold text-white tracking-tight">Usher Dashboard</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    location === item.href
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-white">Usher</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-white"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-primary/20 bg-card/50 backdrop-blur-md flex-shrink-0 h-[100dvh] sticky top-0 flex-col">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Usher Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-4 flex-1">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  location === item.href
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
