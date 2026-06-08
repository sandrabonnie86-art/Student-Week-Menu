import { useState } from "react";
import {
  useGetVendors, getGetVendorsQueryKey,
  useGetMainDishes, getGetMainDishesQueryKey,
  useCreateMainDish, useUpdateMainDish, useDeleteMainDish,
  useCreateMainDishType, useUpdateMainDishType, useDeleteMainDishType,
  useCreateSideItem, useUpdateSideItem, useDeleteSideItem,
  useCreateProteinItem, useUpdateProteinItem, useDeleteProteinItem,
  useUpdateDishConfig,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Settings2,
  Layers, Utensils, Beef, SlidersHorizontal, RefreshCw,
} from "lucide-react";
import type { MainDishFull, MainDishTypeFull, SideItem, ProteinItem } from "@workspace/api-client-react";
import { ImageUpload } from "@/components/ImageUpload";

type DeleteTarget =
  | { kind: "dish"; id: number; name: string }
  | { kind: "type"; id: number; name: string; dishId: number }
  | { kind: "side"; id: number; name: string; typeId: number; dishId: number }
  | { kind: "protein"; id: number; name: string; typeId: number; dishId: number };

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
      {icon} {label}
    </div>
  );
}

function InlineField({
  label, value, onSave, placeholder, type = "text",
}: {
  label: string; value: string | number; onSave: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  return editing ? (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        className="h-7 text-xs bg-background/50 border-primary/20 text-white w-24"
        onKeyDown={e => {
          if (e.key === "Enter") { onSave(val); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <Button size="sm" className="h-7 text-xs px-2 bg-primary hover:bg-primary/90" onClick={() => { onSave(val); setEditing(false); }}>OK</Button>
    </div>
  ) : (
    <button
      className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white group"
      onClick={() => { setVal(String(value)); setEditing(true); }}
    >
      <span className="text-zinc-500 mr-0.5">{label}:</span>
      <span className="border-b border-dashed border-zinc-600 group-hover:border-primary">{value}</span>
      <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-primary" />
    </button>
  );
}

export default function AdminMenuItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [openVendors, setOpenVendors] = useState<Set<number>>(new Set());
  const [openDishes, setOpenDishes] = useState<Set<number>>(new Set());
  const [openTypes, setOpenTypes] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const [newDishForm, setNewDishForm] = useState<{ vendorId: number; name: string } | null>(null);
  const [newTypeForm, setNewTypeForm] = useState<{ dishId: number; name: string; imageUrl: string } | null>(null);
  const [newSideForm, setNewSideForm] = useState<{ typeId: number; dishId: number; name: string; imageUrl: string; isComplementary: boolean } | null>(null);
  const [newProteinForm, setNewProteinForm] = useState<{ typeId: number; dishId: number; name: string; imageUrl: string } | null>(null);
  const [configDialog, setConfigDialog] = useState<{ typeId: number; maxSides: number; maxProteins: number } | null>(null);

  const { data: vendors, refetch: refetchVendors } = useGetVendors({}, { query: { queryKey: getGetVendorsQueryKey({}), refetchInterval: 10000 } });
  const { data: allDishes, refetch: refetchDishes } = useGetMainDishes({}, { query: { queryKey: getGetMainDishesQueryKey({}), refetchInterval: 10000 } });

  const handleReload = async () => {
    setIsReloading(true);
    await Promise.all([refetchVendors(), refetchDishes()]);
    setIsReloading(false);
    toast({ title: "Data refreshed successfully!" });
  };

  const createDish = useCreateMainDish();
  const updateDish = useUpdateMainDish();
  const deleteDish = useDeleteMainDish();
  const createType = useCreateMainDishType();
  const updateType = useUpdateMainDishType();
  const deleteType = useDeleteMainDishType();
  const createSide = useCreateSideItem();
  const updateSide = useUpdateSideItem();
  const deleteSide = useDeleteSideItem();
  const createProtein = useCreateProteinItem();
  const updateProtein = useUpdateProteinItem();
  const deleteProtein = useDeleteProteinItem();
  const updateConfig = useUpdateDishConfig();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetMainDishesQueryKey() });
  };

  const toggle = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "dish") {
      deleteDish.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); toast({ title: "Main dish deleted" }); } });
    } else if (deleteTarget.kind === "type") {
      deleteType.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); toast({ title: "Type deleted" }); } });
    } else if (deleteTarget.kind === "side") {
      deleteSide.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); toast({ title: "Side deleted" }); } });
    } else if (deleteTarget.kind === "protein") {
      deleteProtein.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); toast({ title: "Protein deleted" }); } });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Menu Items</h2>
          <p className="text-muted-foreground mt-1">Manage vendors › main dishes › types › sides &amp; proteins. Sides and proteins are configured per type.</p>
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

      {vendors?.length === 0 && (
        <div className="py-12 text-center text-zinc-500 bg-card/30 rounded-xl border border-primary/10">
          No vendors configured. Add vendors first.
        </div>
      )}

      <div className="space-y-3">
        {vendors?.map(vendor => {
          const vendorDishes = (allDishes ?? []).filter(d => d.vendorId === vendor.id);
          const isVendorOpen = openVendors.has(vendor.id);

          return (
            <Collapsible key={vendor.id} open={isVendorOpen} onOpenChange={() => setOpenVendors(toggle(openVendors, vendor.id))}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-card/60 border border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors select-none">
                  <div className="flex items-center gap-3">
                    {isVendorOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                    <Layers className="h-4 w-4 text-primary/70" />
                    <span className="font-semibold text-white">{vendor.name}</span>
                    <span className="text-xs text-zinc-500">{vendorDishes.length} dish{vendorDishes.length !== 1 ? "es" : ""}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${vendor.isActive ? "bg-primary/20 text-primary" : "bg-zinc-700 text-zinc-400"}`}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="ml-4 mt-2 space-y-2 border-l border-primary/10 pl-4">
                  {vendorDishes.map(dish => {
                    const isDishOpen = openDishes.has(dish.id);
                    return (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        isOpen={isDishOpen}
                        onToggle={() => setOpenDishes(toggle(openDishes, dish.id))}
                        openTypes={openTypes}
                        onToggleType={id => setOpenTypes(toggle(openTypes, id))}
                        onEditDish={(name) => updateDish.mutate({ id: dish.id, data: { name } }, { onSuccess: invalidate })}
                        onDeleteDish={() => setDeleteTarget({ kind: "dish", id: dish.id, name: dish.name })}
                        onAddType={() => setNewTypeForm({ dishId: dish.id, name: "", imageUrl: "" })}
                        onEditType={(id, data) => updateType.mutate({ id, data }, { onSuccess: invalidate })}
                        onDeleteType={(id, name) => setDeleteTarget({ kind: "type", id, name, dishId: dish.id })}
                        onAddSide={(typeId) => setNewSideForm({ typeId, dishId: dish.id, name: "", imageUrl: "", isComplementary: false })}
                        onEditSide={(id, data) => updateSide.mutate({ id, data }, { onSuccess: invalidate })}
                        onDeleteSide={(id, name, typeId) => setDeleteTarget({ kind: "side", id, name, typeId, dishId: dish.id })}
                        onAddProtein={(typeId) => setNewProteinForm({ typeId, dishId: dish.id, name: "", imageUrl: "" })}
                        onEditProtein={(id, data) => updateProtein.mutate({ id, data }, { onSuccess: invalidate })}
                        onDeleteProtein={(id, name, typeId) => setDeleteTarget({ kind: "protein", id, name, typeId, dishId: dish.id })}
                        onOpenConfig={(typeId, maxSides, maxProteins) => setConfigDialog({ typeId, maxSides, maxProteins })}
                      />
                    );
                  })}

                  <button
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 py-2 px-3 rounded-lg hover:bg-primary/10 transition-colors w-full"
                    onClick={() => setNewDishForm({ vendorId: vendor.id, name: "" })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Main Dish
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-primary/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.kind}?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Delete "<strong className="text-white">{deleteTarget?.name}</strong>"? This will also delete all items inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={confirmDelete}
              disabled={deleteDish.isPending || deleteType.isPending || deleteSide.isPending || deleteProtein.isPending}
            >
              {(deleteDish.isPending || deleteType.isPending || deleteSide.isPending || deleteProtein.isPending) ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!newDishForm} onOpenChange={open => !open && setNewDishForm(null)}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Main Dish</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              autoFocus
              placeholder="e.g. Rice"
              value={newDishForm?.name ?? ""}
              onChange={e => setNewDishForm(f => f ? { ...f, name: e.target.value } : f)}
              className="bg-background/50 border-primary/20 text-white"
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!newDishForm?.name?.trim() || createDish.isPending}
              onClick={() => {
                if (!newDishForm) return;
                createDish.mutate(
                  { data: { vendorId: newDishForm.vendorId, name: newDishForm.name.trim() } },
                  { onSuccess: () => { invalidate(); setNewDishForm(null); toast({ title: "Main dish added" }); } }
                );
              }}
            >{createDish.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newTypeForm} onOpenChange={open => !open && setNewTypeForm(null)}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Type</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              autoFocus
              placeholder="e.g. Jollof Rice"
              value={newTypeForm?.name ?? ""}
              onChange={e => setNewTypeForm(f => f ? { ...f, name: e.target.value } : f)}
              className="bg-background/50 border-primary/20 text-white"
            />
            <ImageUpload
              label="Type Image (optional)"
              value={newTypeForm?.imageUrl ?? ""}
              onChange={v => setNewTypeForm(f => f ? { ...f, imageUrl: v } : f)}
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!newTypeForm?.name?.trim() || createType.isPending}
              onClick={() => {
                if (!newTypeForm) return;
                createType.mutate(
                  { data: { mainDishId: newTypeForm.dishId, name: newTypeForm.name.trim(), imageUrl: newTypeForm.imageUrl || undefined } },
                  { onSuccess: () => { invalidate(); setNewTypeForm(null); toast({ title: "Type added" }); } }
                );
              }}
            >{createType.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newSideForm} onOpenChange={open => !open && setNewSideForm(null)}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Side Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              autoFocus
              placeholder="e.g. Coleslaw"
              value={newSideForm?.name ?? ""}
              onChange={e => setNewSideForm(f => f ? { ...f, name: e.target.value } : f)}
              className="bg-background/50 border-primary/20 text-white"
            />
            <ImageUpload
              label="Side Image (optional)"
              value={newSideForm?.imageUrl ?? ""}
              onChange={v => setNewSideForm(f => f ? { ...f, imageUrl: v } : f)}
            />
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-3">
              <div>
                <div className="text-sm font-medium text-white">Complementary</div>
                <div className="text-xs text-zinc-400">Auto-selected, included in price</div>
              </div>
              <Switch
                checked={newSideForm?.isComplementary ?? false}
                onCheckedChange={v => setNewSideForm(f => f ? { ...f, isComplementary: v } : f)}
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!newSideForm?.name?.trim() || createSide.isPending}
              onClick={() => {
                if (!newSideForm) return;
                createSide.mutate(
                  { data: { mainDishTypeId: newSideForm.typeId, name: newSideForm.name.trim(), imageUrl: newSideForm.imageUrl || undefined, isComplementary: newSideForm.isComplementary } },
                  { onSuccess: () => { invalidate(); setNewSideForm(null); toast({ title: "Side item added" }); } }
                );
              }}
            >{createSide.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newProteinForm} onOpenChange={open => !open && setNewProteinForm(null)}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Protein</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              autoFocus
              placeholder="e.g. Chicken"
              value={newProteinForm?.name ?? ""}
              onChange={e => setNewProteinForm(f => f ? { ...f, name: e.target.value } : f)}
              className="bg-background/50 border-primary/20 text-white"
            />
            <ImageUpload
              label="Protein Image (optional)"
              value={newProteinForm?.imageUrl ?? ""}
              onChange={v => setNewProteinForm(f => f ? { ...f, imageUrl: v } : f)}
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!newProteinForm?.name?.trim() || createProtein.isPending}
              onClick={() => {
                if (!newProteinForm) return;
                createProtein.mutate(
                  { data: { mainDishTypeId: newProteinForm.typeId, name: newProteinForm.name.trim(), imageUrl: newProteinForm.imageUrl || undefined } },
                  { onSuccess: () => { invalidate(); setNewProteinForm(null); toast({ title: "Protein added" }); } }
                );
              }}
            >{createProtein.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!configDialog} onOpenChange={open => !open && setConfigDialog(null)}>
        <DialogContent className="bg-card border-primary/20 text-white sm:max-w-sm">
          <DialogHeader><DialogTitle>Configure Type Limits</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Max Sides (0 = unlimited)</label>
              <Input
                type="number"
                min="0"
                value={configDialog?.maxSides ?? 2}
                onChange={e => setConfigDialog(c => c ? { ...c, maxSides: Number(e.target.value) } : c)}
                className="bg-background/50 border-primary/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Max Proteins (0 = unlimited)</label>
              <Input
                type="number"
                min="0"
                value={configDialog?.maxProteins ?? 1}
                onChange={e => setConfigDialog(c => c ? { ...c, maxProteins: Number(e.target.value) } : c)}
                className="bg-background/50 border-primary/20 text-white"
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={updateConfig.isPending}
              onClick={() => {
                if (!configDialog) return;
                updateConfig.mutate(
                  { typeId: configDialog.typeId, data: { maxSides: configDialog.maxSides, maxProteins: configDialog.maxProteins } },
                  { onSuccess: () => { invalidate(); setConfigDialog(null); toast({ title: "Config saved" }); } }
                );
              }}
            >{updateConfig.isPending ? "Saving..." : "Save Config"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DishRow({
  dish, isOpen, onToggle, openTypes, onToggleType,
  onEditDish, onDeleteDish, onAddType,
  onEditType, onDeleteType,
  onAddSide, onEditSide, onDeleteSide,
  onAddProtein, onEditProtein, onDeleteProtein,
  onOpenConfig,
}: {
  dish: MainDishFull;
  isOpen: boolean;
  onToggle: () => void;
  openTypes: Set<number>;
  onToggleType: (id: number) => void;
  onEditDish: (name: string) => void;
  onDeleteDish: () => void;
  onAddType: () => void;
  onEditType: (id: number, data: { name?: string; imageUrl?: string | null; isAvailable?: boolean }) => void;
  onDeleteType: (id: number, name: string) => void;
  onAddSide: (typeId: number) => void;
  onEditSide: (id: number, data: { name?: string; isComplementary?: boolean; isAvailable?: boolean }) => void;
  onDeleteSide: (id: number, name: string, typeId: number) => void;
  onAddProtein: (typeId: number) => void;
  onEditProtein: (id: number, data: { name?: string; isAvailable?: boolean }) => void;
  onDeleteProtein: (id: number, name: string, typeId: number) => void;
  onOpenConfig: (typeId: number, maxSides: number, maxProteins: number) => void;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-card/40 border border-primary/10 rounded-lg cursor-pointer hover:border-primary/30 transition-colors select-none">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />}
            <Utensils className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-medium text-zinc-200 text-sm">{dish.name}</span>
            <span className="text-xs text-zinc-600">{dish.types.length} type{dish.types.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost" size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-white/10"
              onClick={() => { const n = prompt("New name:", dish.name); if (n && n !== dish.name) onEditDish(n); }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={onDeleteDish}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-4 mt-1.5 space-y-2 border-l border-primary/10 pl-4">
          {dish.types.map(type => (
            <TypeRow
              key={type.id}
              type={type}
              isOpen={openTypes.has(type.id)}
              onToggle={() => onToggleType(type.id)}
              onEdit={(data) => onEditType(type.id, data)}
              onDelete={() => onDeleteType(type.id, type.name)}
              onAddSide={() => onAddSide(type.id)}
              onEditSide={onEditSide}
              onDeleteSide={onDeleteSide}
              onAddProtein={() => onAddProtein(type.id)}
              onEditProtein={onEditProtein}
              onDeleteProtein={onDeleteProtein}
              onOpenConfig={() => onOpenConfig(type.id, type.config.maxSides, type.config.maxProteins)}
            />
          ))}
          <button
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 py-1.5 px-2 rounded hover:bg-primary/10 transition-colors"
            onClick={onAddType}
          >
            <Plus className="h-3 w-3" /> Add Type
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TypeRow({
  type, isOpen, onToggle, onEdit, onDelete,
  onAddSide, onEditSide, onDeleteSide,
  onAddProtein, onEditProtein, onDeleteProtein,
  onOpenConfig,
}: {
  type: MainDishTypeFull;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (data: { name?: string; imageUrl?: string | null; isAvailable?: boolean }) => void;
  onDelete: () => void;
  onAddSide: () => void;
  onEditSide: (id: number, data: { name?: string; isComplementary?: boolean; isAvailable?: boolean }) => void;
  onDeleteSide: (id: number, name: string, typeId: number) => void;
  onAddProtein: () => void;
  onEditProtein: (id: number, data: { name?: string; isAvailable?: boolean }) => void;
  onDeleteProtein: (id: number, name: string, typeId: number) => void;
  onOpenConfig: () => void;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2.5 bg-background/30 border border-primary/10 rounded-lg cursor-pointer hover:border-primary/25 transition-colors select-none">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-3 w-3 text-zinc-400" /> : <ChevronRight className="h-3 w-3 text-zinc-600" />}
            <span className="text-sm text-zinc-300">{type.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${type.isAvailable ? "bg-primary/15 text-primary" : "bg-zinc-700 text-zinc-400"}`}>
              {type.isAvailable ? "Available" : "Hidden"}
            </span>
            <span className="text-[10px] text-zinc-600">
              {type.sides.length}S · {type.proteins.length}P · max {type.config.maxSides}/{type.config.maxProteins}
            </span>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-white" onClick={onOpenConfig}>
              <SlidersHorizontal className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-6 w-6 p-0 text-zinc-500 hover:text-white"
              onClick={() => onEdit({ isAvailable: !type.isAvailable })}
            >
              <Settings2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-4 mt-1.5 space-y-3 border-l border-primary/10 pl-4 pb-2">
          <div>
            <SectionLabel icon={<Utensils className="h-3 w-3" />} label="Sides" />
            <div className="space-y-1">
              {type.sides.map(side => (
                <SideItemRow
                  key={side.id}
                  item={side}
                  typeId={type.id}
                  onEdit={(data) => onEditSide(side.id, data)}
                  onDelete={() => onDeleteSide(side.id, side.name, type.id)}
                />
              ))}
              {type.sides.length === 0 && <div className="text-xs text-zinc-600 italic py-1">No sides yet</div>}
            </div>
            <button className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 py-1 mt-0.5" onClick={onAddSide}>
              <Plus className="h-3 w-3" /> Add Side
            </button>
          </div>

          <div>
            <SectionLabel icon={<Beef className="h-3 w-3" />} label="Proteins" />
            <div className="space-y-1">
              {type.proteins.map(protein => (
                <ProteinItemRow
                  key={protein.id}
                  item={protein}
                  typeId={type.id}
                  onEdit={(data) => onEditProtein(protein.id, data)}
                  onDelete={() => onDeleteProtein(protein.id, protein.name, type.id)}
                />
              ))}
              {type.proteins.length === 0 && <div className="text-xs text-zinc-600 italic py-1">No proteins yet</div>}
            </div>
            <button className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 py-1 mt-0.5" onClick={onAddProtein}>
              <Plus className="h-3 w-3" /> Add Protein
            </button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SideItemRow({ item, typeId, onEdit, onDelete }: {
  item: SideItem; typeId: number;
  onEdit: (data: { name?: string; isComplementary?: boolean; isAvailable?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <InlineField label="name" value={item.name} onSave={name => onEdit({ name })} />
      {item.isComplementary && (
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">Comp</span>
      )}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer ${item.isAvailable ? "bg-primary/15 text-primary" : "bg-zinc-700 text-zinc-400"}`}
        onClick={() => onEdit({ isAvailable: !item.isAvailable })}>
        {item.isAvailable ? "On" : "Off"}
      </span>
      <button className="text-[10px] text-zinc-500 hover:text-primary"
        onClick={() => onEdit({ isComplementary: !item.isComplementary })}>
        {item.isComplementary ? "unmark comp" : "mark comp"}
      </button>
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400 opacity-0 group-hover:opacity-100 ml-auto" onClick={onDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function ProteinItemRow({ item, typeId, onEdit, onDelete }: {
  item: ProteinItem; typeId: number;
  onEdit: (data: { name?: string; isAvailable?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <InlineField label="name" value={item.name} onSave={name => onEdit({ name })} />
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer ${item.isAvailable ? "bg-amber-500/15 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}
        onClick={() => onEdit({ isAvailable: !item.isAvailable })}>
        {item.isAvailable ? "On" : "Off"}
      </span>
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400 opacity-0 group-hover:opacity-100 ml-auto" onClick={onDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
