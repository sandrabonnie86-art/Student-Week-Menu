import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetMainDishes, getGetMainDishesQueryKey, useCreateOrder, useGetVendors, getGetVendorsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { MainDishFull, MainDishTypeFull, SideItem, ProteinItem } from "@workspace/api-client-react";

export default function Menu() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const customerName = sessionStorage.getItem("sw_name");
  const tableNumber = sessionStorage.getItem("sw_table");

  useEffect(() => {
    if (!customerName || !tableNumber) setLocation("/");
  }, [customerName, tableNumber, setLocation]);

  const { data: vendors } = useGetVendors({ activeOnly: true }, { query: { queryKey: getGetVendorsQueryKey({ activeOnly: true }) } });
  const vendor = vendors?.find(v => v.id === Number(vendorId));

  const { data: dishes, isLoading } = useGetMainDishes(
    { vendorId: Number(vendorId) },
    { query: { queryKey: getGetMainDishesQueryKey({ vendorId: Number(vendorId) }), enabled: !!vendorId } }
  );

  const createOrder = useCreateOrder();

  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedSideIds, setSelectedSideIds] = useState<number[]>([]);
  const [selectedProteinIds, setSelectedProteinIds] = useState<number[]>([]);

  const selectedDish = useMemo<MainDishFull | null>(
    () => dishes?.find(d => d.id === selectedDishId) ?? null,
    [dishes, selectedDishId]
  );

  const selectedType = useMemo<MainDishTypeFull | null>(
    () => selectedDish?.types.find(t => t.id === selectedTypeId) ?? null,
    [selectedDish, selectedTypeId]
  );

  const compSideIds = useMemo(
    () => selectedType?.sides.filter(s => s.isComplementary && s.isAvailable).map(s => s.id) ?? [],
    [selectedType]
  );

  const maxSides = selectedType?.config?.maxSides ?? 2;
  const maxProteins = selectedType?.config?.maxProteins ?? 1;

  const availableSides = selectedType?.sides.filter(s => s.isAvailable) ?? [];
  const availableProteins = selectedType?.proteins.filter(p => p.isAvailable) ?? [];

  const handleSelectDish = (dishId: number) => {
    setSelectedDishId(dishId);
    setSelectedTypeId(null);
    setSelectedSideIds([]);
    setSelectedProteinIds([]);
  };

  const handleSelectType = (type: MainDishTypeFull) => {
    setSelectedTypeId(type.id);
    const compIds = type.sides.filter(s => s.isComplementary && s.isAvailable).map(s => s.id);
    setSelectedSideIds([...compIds]);
    setSelectedProteinIds([]);
  };

  const handleSideToggle = (id: number, isComp: boolean) => {
    setSelectedSideIds(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (!isComp) {
        const nonCompSelected = prev.filter(sid => !compSideIds.includes(sid));
        if (maxSides > 0 && nonCompSelected.length >= maxSides) {
          toast({ title: "Limit reached", description: `Max ${maxSides} non-complementary side${maxSides > 1 ? "s" : ""} allowed.` });
          return prev;
        }
      }
      return [...prev, id];
    });
  };

  const handleProteinToggle = (id: number) => {
    setSelectedProteinIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (maxProteins > 0 && prev.length >= maxProteins) {
        toast({ title: "Limit reached", description: `Max ${maxProteins} protein${maxProteins > 1 ? "s" : ""} allowed.` });
        return prev;
      }
      return [...prev, id];
    });
  };

  const canOrder = selectedTypeId && 
    (availableSides.length === 0 || selectedSideIds.length > 0) && 
    (availableProteins.length === 0 || selectedProteinIds.length > 0);

  const handlePlaceOrder = () => {
    if (!canOrder) {
      let description = "Please select a dish type";
      if (availableSides.length > 0 && selectedSideIds.length === 0) {
        description += ", at least one side";
      }
      if (availableProteins.length > 0 && selectedProteinIds.length === 0) {
        description += ", at least one protein";
      }
      description += ".";
      
      toast({
        title: "Incomplete selection",
        description: description,
        variant: "destructive",
      });
      return;
    }
    createOrder.mutate(
      {
        data: {
          customerName: customerName!,
          tableNumber: tableNumber!,
          vendorId: Number(vendorId),
          mainDishTypeId: selectedTypeId!,
          sideIds: selectedSideIds,
          proteinIds: selectedProteinIds,
        },
      },
      {
        onSuccess: (data) => setLocation(`/order-complete?id=${data.id}`),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Something went wrong. Please try again.";
          toast({ title: "Order failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const step = !selectedDishId ? 1 : !selectedTypeId ? 2 : 3;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] p-4 max-w-2xl mx-auto space-y-6 pb-32 pt-8">
        <Skeleton className="h-8 w-1/3 bg-muted/50" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full bg-muted/50" />)}
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">No menu available</h2>
          <p className="text-zinc-400">This vendor hasn't set up their menu yet.</p>
          <Button variant="outline" onClick={() => setLocation("/vendors")} className="border-primary/20 text-white">
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] p-4 max-w-2xl mx-auto space-y-6 pb-36 pt-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <button onClick={() => setLocation("/vendors")} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight">{vendor?.name ?? "Menu"}</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className={step >= 1 ? "text-primary font-medium" : ""}>1. Dish</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step >= 2 ? "text-primary font-medium" : ""}>2. Type</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step >= 3 ? "text-primary font-medium" : ""}>3. Sides &amp; Proteins</span>
        </div>
      </motion.div>

      {/* Step 1: Choose Main Dish */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Choose a Main Dish</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dishes.map(dish => (
            <button
              key={dish.id}
              type="button"
              onClick={() => handleSelectDish(dish.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedDishId === dish.id
                  ? "bg-primary/20 border-primary text-white"
                  : "bg-card/50 border-primary/10 text-zinc-300 hover:border-primary/40 hover:bg-card/80"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">{dish.name}</span>
                {selectedDishId === dish.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{dish.types.filter(t => t.isAvailable).length} types available</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Step 2: Choose Type */}
      <AnimatePresence>
        {selectedDish && (
          <motion.section
            key="types"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Choose a Type{" "}
              <span className="text-zinc-500 font-normal normal-case">— for {selectedDish.name}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedDish.types.filter(t => t.isAvailable).map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelectType(type)}
                  className={`relative text-left rounded-xl border overflow-hidden transition-all ${
                    selectedTypeId === type.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-primary/10 hover:border-primary/40"
                  }`}
                >
                  {type.imageUrl ? (
                    <img src={type.imageUrl} alt={type.name} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-primary/5 flex items-center justify-center">
                      <span className="text-3xl">🍽️</span>
                    </div>
                  )}
                  <div className="p-2 bg-card/80">
                    <p className="text-sm font-medium text-white leading-tight">{type.name}</p>
                    {selectedTypeId === type.id && (
                      <span className="text-xs text-primary">Selected ✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedDish.types.filter(t => t.isAvailable).length === 0 && (
              <p className="text-sm text-zinc-500 italic">No types available for this dish.</p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Step 3: Sides & Proteins — from the selected TYPE */}
      <AnimatePresence>
        {selectedTypeId && selectedType && (
          <motion.div
            key="sides-proteins"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Sides */}
            {availableSides.length > 0 && (
              <section className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Sides</h2>
                  <span className="text-xs text-zinc-400">
                    {maxSides > 0 ? `Up to ${maxSides} (excluding complementary)` : "Unlimited"}
                  </span>
                </div>
                <div className="space-y-2">
                  {availableSides.map(side => (
                    <div
                      key={side.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedSideIds.includes(side.id) ? "border-primary/40 bg-primary/5" : "border-primary/10 bg-card/40"
                      }`}
                    >
                      {side.imageUrl && (
                        <img src={side.imageUrl} alt={side.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <Checkbox
                        id={`side-${side.id}`}
                        checked={selectedSideIds.includes(side.id)}
                        onCheckedChange={() => handleSideToggle(side.id, side.isComplementary)}
                        className="border-primary/40"
                        disabled={side.isComplementary}
                      />
                      <Label htmlFor={`side-${side.id}`} className={`flex-1 flex justify-between items-center ${side.isComplementary ? "cursor-default" : "cursor-pointer"}`}>
                        <span className="font-medium text-white text-sm">{side.name}</span>
                        {side.isComplementary && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded ml-2">
                            Complementary — can decline
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Proteins */}
            {availableProteins.length > 0 && (
              <section className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Proteins</h2>
                  <span className="text-xs text-zinc-400">
                    {maxProteins > 0 ? `Up to ${maxProteins}` : "Unlimited"}
                  </span>
                </div>
                <div className="space-y-2">
                  {availableProteins.map(protein => (
                    <div
                      key={protein.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedProteinIds.includes(protein.id) ? "border-primary/40 bg-primary/5" : "border-primary/10 bg-card/40"
                      }`}
                    >
                      {protein.imageUrl && (
                        <img src={protein.imageUrl} alt={protein.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <Checkbox
                        id={`protein-${protein.id}`}
                        checked={selectedProteinIds.includes(protein.id)}
                        onCheckedChange={() => handleProteinToggle(protein.id)}
                        className="border-primary/40"
                      />
                      <Label htmlFor={`protein-${protein.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-white text-sm">{protein.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {availableSides.length === 0 && availableProteins.length === 0 && (
              <div className="text-sm text-zinc-500 italic py-4 text-center">
                No sides or proteins configured for this type yet.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-primary/20 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-zinc-400 flex-1 min-w-0">
            {!selectedDishId && <span>Select a main dish to start</span>}
            {selectedDishId && !selectedTypeId && <span className="text-zinc-300">Now choose a type</span>}
            {selectedTypeId && (
              <span>
                {selectedSideIds.length} side{selectedSideIds.length !== 1 ? "s" : ""} · {selectedProteinIds.length} protein{selectedProteinIds.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={!canOrder || createOrder.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shrink-0"
          >
            {createOrder.isPending ? "Placing..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
