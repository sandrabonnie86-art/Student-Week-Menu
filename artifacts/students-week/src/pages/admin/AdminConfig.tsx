import { useEffect, useRef, useState } from "react";
import { useGetConfig, getGetConfigQueryKey, useUpdateConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

const configSchema = z.object({
  maxSides: z.coerce.number().min(1, "Must be at least 1"),
  maxProteins: z.coerce.number().min(1, "Must be at least 1"),
  allowMultipleMains: z.boolean().default(false),
  adminPin: z.string().optional(),
  usherPin: z.string().optional(),
});

export default function AdminConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading, refetch: refetchConfig } = useGetConfig({ query: { queryKey: getGetConfigQueryKey(), refetchInterval: 10000 } });
  const updateConfig = useUpdateConfig();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    await refetchConfig();
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: { maxSides: 2, maxProteins: 1, allowMultipleMains: false, adminPin: "", usherPin: "" },
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (config && !initialized.current) {
      form.reset({
        maxSides: config.maxSides,
        maxProteins: config.maxProteins,
        allowMultipleMains: config.allowMultipleMains,
        adminPin: config.adminPin ?? "",
        usherPin: config.usherPin ?? "",
      });
      initialized.current = true;
    }
  }, [config, form]);

  const onSubmit = (values: z.infer<typeof configSchema>) => {
    updateConfig.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
          toast({ title: "Configuration saved successfully." });
        },
        onError: () => {
          toast({ title: "Failed to save configuration.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Configuration</h2>
          <p className="text-muted-foreground mt-1">Global settings for the ordering experience.</p>
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

      <Card className="bg-card/40 border-primary/10">
        <CardHeader>
          <CardTitle className="text-white">Order Limits</CardTitle>
          <CardDescription className="text-zinc-400">Control how many items a student can select per order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxSides"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Maximum Sides</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className="bg-background/50 border-primary/20 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxProteins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Maximum Proteins</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className="bg-background/50 border-primary/20 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowMultipleMains"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-zinc-300">Allow Multiple Mains</FormLabel>
                      <div className="text-sm text-muted-foreground">If disabled, users can only select exactly 1 main dish.</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Admin PIN</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-background/50 border-primary/20 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usherPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Usher PIN</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-background/50 border-primary/20 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
