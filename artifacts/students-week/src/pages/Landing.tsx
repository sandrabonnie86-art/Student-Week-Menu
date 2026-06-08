import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  tableNumber: z.string().min(1, "Table number is required"),
});

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const lockedTable = searchParams.get("table");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", tableNumber: lockedTable ?? "" },
  });

  useEffect(() => {
    const savedName = sessionStorage.getItem("sw_name");
    if (savedName) form.setValue("fullName", savedName);
    if (lockedTable) {
      form.setValue("tableNumber", lockedTable);
    } else {
      const savedTable = sessionStorage.getItem("sw_table");
      if (savedTable) form.setValue("tableNumber", savedTable);
    }
  }, [form, lockedTable]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsChecking(true);
    try {
      const response = await fetch(`/api/orders/check/${encodeURIComponent(values.fullName.trim())}`);
      const data = await response.json();
      if (data.exists) {
        toast({
          title: "Duplicate name",
          description: `An order already exists for "${values.fullName.trim()}". Each person can only order once.`,
          variant: "destructive",
        });
        return;
      }
      sessionStorage.setItem("sw_name", values.fullName.trim());
      sessionStorage.setItem("sw_table", values.tableNumber.trim());
      setLocation("/vendors");
    } catch (error) {
      toast({
        title: "Error checking name",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm font-sans">
            Students Week <span className="text-primary block mt-2">2026</span>
          </h1>
          <p className="text-muted-foreground text-lg">Secure your spot. Customize your meal.</p>
        </div>

        <div className="bg-card/50 backdrop-blur-md border border-primary/20 p-6 md:p-8 rounded-2xl shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="bg-background/50 border-primary/30 text-white placeholder:text-muted-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300 flex items-center gap-2">
                      Table Number
                      {lockedTable && (
                        <span className="flex items-center gap-1 text-xs text-primary font-normal">
                          <Lock className="h-3 w-3" /> Pre-set via QR code
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      {lockedTable ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-primary font-semibold">
                          <Lock className="h-4 w-4" />
                          <span>{lockedTable}</span>
                        </div>
                      ) : (
                        <Input
                          placeholder="e.g. A12"
                          className="bg-background/50 border-primary/30 text-white placeholder:text-muted-foreground"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                    {!lockedTable && (
                      <p className="text-xs text-zinc-500">Scan the QR code on your table to auto-fill this.</p>
                    )}
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-lg"
                disabled={isChecking}
              >
                {isChecking ? "Checking..." : "Enter"}
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
