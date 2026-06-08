import { useGetVendors, getGetVendorsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function Vendors() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!sessionStorage.getItem("sw_name")) {
      setLocation("/");
    }
  }, [setLocation]);

  const { data: vendors, isLoading } = useGetVendors(
    { activeOnly: true },
    { query: { queryKey: getGetVendorsQueryKey({ activeOnly: true }), refetchInterval: 10000 } }
  );

  return (
    <div className="min-h-[100dvh] p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 pt-8"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Select a Vendor</h1>
        <p className="text-muted-foreground">Choose where you'd like to order from tonight.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card/50 border-primary/10">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 bg-muted/50" />
                <Skeleton className="h-4 w-full bg-muted/50" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full bg-muted/50" />
              </CardFooter>
            </Card>
          ))
        ) : vendors?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-xl border border-primary/10">
            No active vendors available right now. Please check back later.
          </div>
        ) : (
          vendors?.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`bg-card/60 backdrop-blur-sm transition-colors flex flex-col h-full ${vendor.maxPlates !== null && vendor.maxPlates > 0 && (vendor.orderCount || 0) >= vendor.maxPlates ? "border-primary/10 opacity-70 grayscale" : "border-primary/20 hover:border-primary/50"}`}>
                <CardHeader className="flex-1">
                  <CardTitle className="text-xl text-white flex justify-between items-start">
                    <span>{vendor.name}</span>
                    {vendor.maxPlates !== null && vendor.maxPlates > 0 && (
                      <span className="text-xs font-normal text-zinc-400 bg-background/50 px-2 py-1 rounded-full whitespace-nowrap">
                        {vendor.orderCount || 0} / {vendor.maxPlates} plates
                      </span>
                    )}
                  </CardTitle>
                  {vendor.description && (
                    <CardDescription className="text-zinc-400 line-clamp-3">
                      {vendor.description}
                    </CardDescription>
                  )}
                  {vendor.maxPlates !== null && vendor.maxPlates > 0 && (vendor.orderCount || 0) >= vendor.maxPlates && (
                    <div className="mt-2 text-red-400 text-sm font-semibold border border-red-400/20 bg-red-400/10 px-2 py-1 rounded inline-block">
                      Sold Out
                    </div>
                  )}
                </CardHeader>
                <CardFooter>
                  <Button 
                    className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                    onClick={() => setLocation(`/menu/${vendor.id}`)}
                    disabled={vendor.maxPlates !== null && vendor.maxPlates > 0 && (vendor.orderCount || 0) >= vendor.maxPlates}
                  >
                    Select Menu <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
