import { useLocation } from "wouter";
import { Home, Users, FileText, BarChart2, CheckSquare, Heart, Search, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import ClockButton from "../clock/clock-button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  // Nav items change based on role
  const caregiverNav = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/clients", icon: Users, label: "Clients" },
    // clock button goes here (center)
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/reports", icon: BarChart2, label: "Reports" },
  ];

  const familyNav = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/family", icon: Heart, label: "My Care" },
    { path: "/marketplace", icon: Search, label: "Find Care" },
    { path: "/notes", icon: FileText, label: "Notes" },
  ];

  const adminNav = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/admin", icon: Shield, label: "Admin" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/marketplace", icon: Search, label: "Market" },
  ];

  const navItems = user?.role === "platform_admin" ? adminNav
    : user?.role === "family" ? familyNav
    : caregiverNav;
  const showClockButton = user?.role === "caregiver" || user?.role === "independent_caregiver";
  const leftItems = showClockButton ? navItems.slice(0, 2) : navItems;
  const rightItems = showClockButton ? navItems.slice(2) : [];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[414px] bg-slate-900 border-t border-slate-800 z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {leftItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => setLocation(item.path)}
              className="flex flex-col items-center py-1.5 px-3 min-w-0">
              <Icon size={20} className={active ? "text-emerald-400" : "text-slate-500"} />
              <span className={`text-xs mt-0.5 ${active ? "text-emerald-400 font-medium" : "text-slate-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {showClockButton && <ClockButton />}

        {rightItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => setLocation(item.path)}
              className="flex flex-col items-center py-1.5 px-3 min-w-0">
              <Icon size={20} className={active ? "text-emerald-400" : "text-slate-500"} />
              <span className={`text-xs mt-0.5 ${active ? "text-emerald-400 font-medium" : "text-slate-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
