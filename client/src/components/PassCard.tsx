import { Button } from "@/components/ui/button";
import type { PassWithDetails } from "@shared/schema";

interface PassCardProps {
  pass: PassWithDetails;
  onMarkReturned: () => void;
  isLoading?: boolean;
  "data-testid"?: string;
}

export default function PassCard({ pass, onMarkReturned, isLoading, "data-testid": testId }: PassCardProps) {
  const duration = pass.returnedAt 
    ? pass.duration 
    : Math.floor((Date.now() - new Date(pass.issuedAt).getTime()) / (1000 * 60));
    
  const isOverdue = !pass.returnedAt && duration > 15; // Consider overdue after 15 minutes

  return (
    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg" data-testid={testId}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {pass.student.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900" data-testid={`text-student-name`}>
            {pass.student.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{pass.passType.name}</span> • 
            <span className="ml-1">{duration} min</span> • 
            <span className={`ml-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              Since {new Date(pass.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
      </div>
      {!pass.returnedAt && (
        <Button 
          onClick={onMarkReturned}
          disabled={isLoading}
          size="sm"
          className="bg-pilot-blue hover:bg-pilot-blue-dark"
          data-testid="button-mark-returned"
        >
          {isLoading ? "Processing..." : "Mark Returned"}
        </Button>
      )}
    </div>
  );
}
