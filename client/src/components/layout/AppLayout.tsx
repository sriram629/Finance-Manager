import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "../../lib/utils";

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("authToken");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      {/* Overlay for mobile - appears behind sidebar but above content */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={cn(
          "transition-all duration-300 min-h-[calc(100vh-4rem)]",
          "lg:ml-0",
          sidebarOpen && "lg:ml-64"
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
