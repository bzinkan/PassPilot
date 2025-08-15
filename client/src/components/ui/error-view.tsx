import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorViewProps {
  message?: string;
  title?: string;
  className?: string;
}

export function ErrorView({ 
  message = "Something went wrong", 
  title = "Error",
  className = ""
}: ErrorViewProps) {
  return (
    <Alert variant="destructive" className={className} data-testid="error-view">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle data-testid="error-title">{title}</AlertTitle>
      <AlertDescription data-testid="error-message">
        {message}
      </AlertDescription>
    </Alert>
  );
}