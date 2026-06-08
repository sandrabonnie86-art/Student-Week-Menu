import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useVerifyAdminPin } from "@workspace/api-client-react";
import { ROUTES } from "@/constants/routes";

const adminLoginSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const verifyPin = useVerifyAdminPin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    console.log("Submitting data:", data);
    setIsSubmitting(true);
    try {
      const result = await verifyPin.mutateAsync({ data });
      console.log("Verify result:", result);
      if (result.valid) {
        localStorage.setItem("adminAuthenticated", "true");
        if (result.token) {
          localStorage.setItem("adminToken", result.token);
        }
        console.log("Navigating to:", ROUTES.ADMIN_DASHBOARD);
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        toast({ title: "Invalid PIN", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      toast({ title: "Error verifying PIN", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-primary/20 rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-muted-foreground mt-2">Enter your admin PIN to continue</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter PIN"
              {...register("pin")}
              disabled={isSubmitting}
              className="bg-background/50 border-primary/20 text-white"
            />
            {errors.pin && (
              <p className="text-red-500 text-sm">{errors.pin.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
