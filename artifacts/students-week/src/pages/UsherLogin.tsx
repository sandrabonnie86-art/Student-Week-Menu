import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useVerifyUsherPin } from "@workspace/api-client-react";
import { ROUTES } from "@/constants/routes";

const usherLoginSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

type UsherLoginFormData = z.infer<typeof usherLoginSchema>;

export default function UsherLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const verifyPin = useVerifyUsherPin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsherLoginFormData>({
    resolver: zodResolver(usherLoginSchema),
  });

  const onSubmit = async (data: UsherLoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await verifyPin.mutateAsync({ data });
      if (result.valid) {
        localStorage.setItem("usherAuthenticated", "true");
        if (result.token) {
          localStorage.setItem("usherToken", result.token);
        }
        navigate(ROUTES.USHER_DASHBOARD);
      } else {
        toast({ title: "Invalid PIN", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error verifying PIN", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-primary/20 rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Usher Login</h1>
          <p className="text-muted-foreground mt-2">Enter your PIN to continue</p>
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
