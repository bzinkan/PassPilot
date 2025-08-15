import type { Student } from "@shared/schema";

interface StudentCardProps {
  student: Student;
  "data-testid"?: string;
}

export default function StudentCard({ student, "data-testid": testId }: StudentCardProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors" data-testid={testId}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-xs">
            {student.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <span className="font-medium text-gray-900" data-testid="text-student-name">
          {student.name}
        </span>
        {student.studentId && (
          <span className="text-xs text-gray-500" data-testid="text-student-id">
            ({student.studentId})
          </span>
        )}
      </div>
      <div className="relative">
        <button 
          className="text-gray-400 hover:text-gray-600 p-1"
          data-testid="button-student-menu"
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  );
}
