import { useLocation } from "wouter";
import { useClock } from "@/hooks/use-clock";
import ClockButton from "../clock/clock-button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isClocked } = useClock();

  const navItems = [
    { path: "/", icon: "fas fa-home", label: "Dashboard" },
    { path: "/clients", icon: "fas fa-users", label: "Clients" },
    { path: "/notes", icon: "fas fa-sticky-note", label: "Notes" },
    { path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[414px] bg-white border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className="flex flex-col items-center py-2 px-3"
          >
            <i className={`${item.icon} text-lg ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}></i>
            <span className={`text-xs ${isActive(item.path) ? 'text-primary font-medium' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Central Clock Button */}
        <ClockButton />

        {navItems.slice(2).map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className="flex flex-col items-center py-2 px-3"
          >
            <i className={`${item.icon} text-lg ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}></i>
            <span className={`text-xs ${isActive(item.path) ? 'text-primary font-medium' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
