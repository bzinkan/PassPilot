import { Button } from "@/components/ui/button";
import type { Grade } from "@shared/schema";

interface GradeCardProps {
  grade: any; // Grade with students relation
  isSelected: boolean;
  onToggleSelect: () => void;
  "data-testid"?: string;
}

export default function GradeCard({ grade, isSelected, onToggleSelect, "data-testid": testId }: GradeCardProps) {
  const studentCount = grade.students?.length || 0;

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 ${
        isSelected ? "border-green-200" : "border-gray-200"
      }`}
      onClick={onToggleSelect}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900" data-testid="text-grade-name">
          {grade.name}
        </h4>
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-gray-600" data-testid="button-grade-settings">
            <i className="fas fa-cog"></i>
          </button>
          <button className="text-gray-400 hover:text-gray-600" data-testid="button-grade-edit">
            <i className="fas fa-edit"></i>
          </button>
          <button className="text-gray-400 hover:text-gray-600" data-testid="button-grade-delete">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <p className={`text-3xl font-bold mb-2 ${isSelected ? 'text-green-500' : 'text-gray-900'}`} data-testid="text-student-count">
        {studentCount} students
      </p>
      
      <p className={`text-sm mb-4 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
        {isSelected ? "✓ Active in MyClass" : "Click to add to MyClass"}
      </p>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={(e) => e.stopPropagation()}
          data-testid="button-add-student"
        >
          Add Student
        </Button>
        <Button 
          size="sm" 
          className="flex-1 bg-pilot-blue hover:bg-pilot-blue-dark"
          onClick={(e) => e.stopPropagation()}
          data-testid="button-bulk-add"
        >
          Bulk Add
        </Button>
      </div>
    </div>
  );
}
