import { useState } from "react";
import { useGetVendors, getGetVendorsQueryKey, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit2, RefreshCw } from "lucide-react";
import type { Vendor } from "@workspace/api-client-react";
import { ImageUpload } from "@/components/ImageUpload";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  maxPlates: z.coerce.number().min(0).default(0),
  vendorPin: z.string().optional(),
});

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: vendors, refetch: refetchVendors } = useGetVendors({}, { query: { queryKey: getGetVendorsQueryKey({}), refetchInterval: 10000 } });
  const [isReloading, setIsReloading] = useState(false);

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [isOpen, setIsOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const form = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: "", description: "", imageUrl: "", isActive: true, maxPlates: 0 },
  });

  const handleReload = async () => {
    setIsReloading(true);
    await refetchVendors();
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  const onSubmit = (values: z.infer<typeof vendorSchema>) => {
    const payload = {
      name: values.name,
      description: values.description,
      imageUrl: values.imageUrl || undefined,
      isActive: values.isActive,
      maxPlates: values.maxPlates,
      vendorPin: values.vendorPin || undefined,
    };
    if (editingVendor) {
      updateVendor.mutate(
        { id: editingVendor.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
            toast({ title: "Vendor updated" });
            setIsOpen(false);
            setEditingVendor(null);
            form.reset();
          },
        }
      );
    } else {
      createVendor.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
            toast({ title: "Vendor created" });
            setIsOpen(false);
            form.reset();
          },
        }
      );
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({
      name: vendor.name,
      description: vendor.description || "",
      imageUrl: vendor.imageUrl || "",
      isActive: vendor.isActive,
      maxPlates: vendor.maxPlates || 0,
      vendorPin: vendor.vendorPin || "",
    });
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteVendor.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVendorsQueryKey() });
          toast({ title: "Vendor deleted" });
          setDeleteTarget(null);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingVendor(null);
      form.reset({ name: "", description: "", imageUrl: "", isActive: true, maxPlates: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Vendors</h2>
          <p className="text-muted-foreground mt-1">Manage food vendors and their active status.</p>
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
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">Add Vendor</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/20 text-white sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 border-primary/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="bg-background/50 border-primary/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            label="Vendor Image"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxPlates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Plates (0 = unlimited)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" className="bg-background/50 border-primary/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendorPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor PIN</FormLabel>
                        <FormControl>
                          <Input type="password" className="bg-background/50 border-primary/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">Is this vendor currently available?</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createVendor.isPending || updateVendor.isPending}>
                    {createVendor.isPending || updateVendor.isPending ? "Saving..." : (editingVendor ? "Update" : "Create")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors?.map(vendor => (
          <Card key={vendor.id} className="bg-card/40 border-primary/10 overflow-hidden">
            {vendor.imageUrl && (
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={vendor.imageUrl}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg text-white">
                  {vendor.name}
                  {vendor.orderCount !== undefined && (
                    <span className="ml-2 text-xs font-normal text-zinc-400">
                      — {vendor.orderCount} orders
                    </span>
                  )}
                </CardTitle>
                <div className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full inline-block ${vendor.isActive ? "bg-primary/20 text-primary" : "bg-zinc-500/20 text-zinc-400"}`}>
                  {vendor.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => handleEdit(vendor)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => setDeleteTarget(vendor)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 line-clamp-2">{vendor.description || "No description"}</p>
              {vendor.maxPlates > 0 && (
                <p className="text-xs text-zinc-500 mt-2">{vendor.orderCount ?? 0} / {vendor.maxPlates} plates</p>
              )}
              {vendor.vendorPin && (
                <p className="text-xs text-primary mt-2">Vendor PIN: {vendor.vendorPin}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {vendors?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-xl border border-primary/10">
            No vendors configured.
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-primary/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Delete "<strong className="text-white">{deleteTarget?.name}</strong>"? This will also remove all their menu items and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete} disabled={deleteVendor.isPending}>
              {deleteVendor.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
