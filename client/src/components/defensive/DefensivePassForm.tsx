import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequestJson } from "@/lib/queryClient";

// Validation schema with safe defaults
const createPassSchema = z.object({
  studentName: z.string().min(1, "Student name is required").max(100, "Name too long"),
  reason: z.enum(["Bathroom", "Nurse", "Office", "Water", "Other"], {
    required_error: "Please select a reason",
  }),
  notes: z.string().max(500, "Notes too long").optional(),
});

type CreatePassForm = z.infer<typeof createPassSchema>;

// Types would come from shared schema
type Pass = {
  id: string;
  studentName: string;
  reason: string;
  status: "active" | "completed" | "expired";
  startsAt: string;
  notes?: string;
};

interface DefensivePassFormProps {
  schoolId?: string;
  userId?: string;
  onSuccess?: (pass: Pass) => void;
  className?: string;
}

export function DefensivePassForm({ 
  schoolId,
  userId,
  onSuccess,
  className = ""
}: DefensivePassFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form with defensive defaults
  const form = useForm<CreatePassForm>({
    resolver: zodResolver(createPassSchema),
    defaultValues: {
      studentName: "",
      notes: "",
    },
  });

  // Mutation with proper error handling
  const createPassMutation = useMutation({
    mutationFn: async (data: CreatePassForm) => {
      if (!schoolId || !userId) {
        throw new Error("Missing required information");
      }

      return apiRequestJson<Pass>("POST", "/api/passes", {
        ...data,
        schoolId,
        issuedByUserId: userId,
      });
    },
    onSuccess: (newPass) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/passes", schoolId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/dashboard/stats", schoolId] 
      });

      // Reset form
      form.reset();
      setIsSubmitting(false);

      // Show success message
      toast({
        title: "Pass created",
        description: `Pass issued for ${newPass.studentName}`,
      });

      // Callback for parent component
      onSuccess?.(newPass);
    },
    onError: (error) => {
      setIsSubmitting(false);
      
      toast({
        title: "Failed to create pass",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreatePassForm) => {
    // Guard against multiple submissions
    if (isSubmitting) return;
    
    // Guard against missing required props
    if (!schoolId || !userId) {
      toast({
        title: "Error",
        description: "Missing school or user information",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createPassMutation.mutate(data);
  };

  // Reasons dropdown options with safe defaults
  const passReasons = [
    { value: "Bathroom", label: "Bathroom" },
    { value: "Nurse", label: "Nurse" },
    { value: "Office", label: "Office" },
    { value: "Water", label: "Water" },
    { value: "Other", label: "Other" },
  ] as const;

  return (
    <div className={className} data-testid="pass-form">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="studentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="student-name-label">Student Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter student name"
                    {...field}
                    disabled={isSubmitting}
                    data-testid="input-student-name"
                  />
                </FormControl>
                <FormMessage data-testid="student-name-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="reason-label">Reason</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-reason">
                      <SelectValue placeholder="Select reason for pass" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {passReasons.map((reason) => (
                      <SelectItem 
                        key={reason.value} 
                        value={reason.value}
                        data-testid={`reason-option-${reason.value.toLowerCase()}`}
                      >
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage data-testid="reason-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="notes-label">Notes (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Additional notes..."
                    {...field}
                    value={field.value ?? ""} // Guard against undefined
                    disabled={isSubmitting}
                    data-testid="input-notes"
                  />
                </FormControl>
                <FormMessage data-testid="notes-error" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !schoolId || !userId}
            className="w-full"
            data-testid="button-create-pass"
          >
            {isSubmitting ? "Creating Pass..." : "Create Pass"}
          </Button>
        </form>
      </Form>
    </div>
  );
}