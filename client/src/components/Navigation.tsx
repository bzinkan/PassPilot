interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Passes", icon: "fas fa-home" },
    { id: "myclass", label: "My Class", icon: "fas fa-users" },
    { id: "roster", label: "Roster", icon: "fas fa-list" },
    { id: "upload", label: "Upload", icon: "fas fa-upload" },
    { id: "reports", label: "Reports", icon: "fas fa-chart-bar" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
    { id: "kiosk", label: "Kiosk", icon: "fas fa-tablet-alt" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-7">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center p-3 transition-colors ${
              activeTab === item.id
                ? "text-pilot-blue"
                : "text-gray-600 hover:text-pilot-blue"
            }`}
            data-testid={`nav-${item.id}`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
