import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";

export default function OrderComplete() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("id");

  useEffect(() => {
    if (!orderId) setLocation("/");
  }, [orderId, setLocation]);

  const { data: order, isLoading } = useGetOrder(
    Number(orderId),
    { query: { queryKey: getGetOrderQueryKey(Number(orderId)), enabled: !!orderId } }
  );

  const handleStartNew = () => {
    sessionStorage.removeItem("sw_name");
    sessionStorage.removeItem("sw_table");
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm border-primary/20">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto bg-muted/50" />
            <Skeleton className="h-8 w-2/3 mx-auto bg-muted/50" />
            <Skeleton className="h-4 w-1/2 mx-auto bg-muted/50" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/60 backdrop-blur-sm border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">Order Confirmed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Order <span className="text-primary font-mono font-bold">#{order.id.toString().padStart(4, "0")}</span> placed
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-background/40 p-4 rounded-xl border border-primary/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium text-white">{order.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Table</span>
                <span className="font-medium text-white">{order.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Vendor</span>
                <span className="font-medium text-white">{order.vendorName}</span>
              </div>
              {order.mainDishName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Dish</span>
                  <span className="font-medium text-white">{order.mainDishName}</span>
                </div>
              )}
              {order.mainDishTypeName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Type</span>
                  <span className="font-medium text-primary">{order.mainDishTypeName}</span>
                </div>
              )}
            </div>

            {(order.sides.length > 0 || order.proteins.length > 0) && (
              <div className="space-y-3">
                {order.sides.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Sides</h3>
                    <ul className="space-y-1">
                      {order.sides.map(s => (
                        <li key={s.id} className="flex justify-between items-center bg-background/20 px-3 py-2 rounded text-sm">
                          <span className="text-zinc-200">{s.sideName}</span>
                          {s.isComplementary && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">Complementary</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {order.proteins.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Proteins</h3>
                    <ul className="space-y-1">
                      {order.proteins.map(p => (
                        <li key={p.id} className="bg-background/20 px-3 py-2 rounded text-sm text-zinc-200">
                          {p.proteinName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-primary/10">
              <Button onClick={handleStartNew} variant="outline" className="w-full border-primary/20 text-white hover:bg-primary/20">
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
