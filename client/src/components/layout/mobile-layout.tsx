import { ReactNode } from "react";
import BottomNavigation from "./bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="app-container bg-white shadow-xl max-w-[414px] mx-auto min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-heart text-xl"></i>
            <div>
              <h1 className="text-lg font-semibold">CareTrack</h1>
              <p className="text-blue-100 text-xs">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-blue-600 px-2 py-1 rounded-full text-xs">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span>On Duty</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 min-h-[calc(100vh-80px)]">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
