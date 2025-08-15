interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: "blue" | "red" | "green" | "yellow";
  "data-testid"?: string;
}

export default function StatsCard({ title, value, icon, color = "blue", "data-testid": testId }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-pilot-blue",
    red: "bg-red-100 text-red-500",
    green: "bg-green-100 text-green-500",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const valueColorClasses = {
    blue: "text-gray-900",
    red: "text-red-500",
    green: "text-green-500", 
    yellow: "text-gray-900",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${valueColorClasses[color]}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <i className={`${icon} text-xl`}></i>
          </div>
        )}
      </div>
    </div>
  );
}
