import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import AppIcon from "./AppIcon";
import { useApp } from "../context/AppContext";

const TABS = [
  { to: "/dashboard", label: "Overview", icon: "dashboard" },
  { to: "/new-test", label: "Quick Test", icon: "bolt" },
  { to: "/pro-mode", label: "Pro Mode", icon: "psychology" },
  { to: "/history", label: "Audit Vault", icon: "folder_shared" },
  { to: "/analytics", label: "Analytics", icon: "bar_chart" },
  { to: "/scenario-playground", label: "Simulations", icon: "science" },
  { to: "/models", label: "Engine Config", icon: "settings_input_component" },
  { to: "/profile", label: "Settings", icon: "settings" },
];

export function AppShell({ title, children, actions }) {
  const {
    currentUser,
    role,
    logout,
    networkError,
    isVaultFallback,
    notificationPermission,
    notificationsEnabled,
    requestNotificationAccess,
    disableNotifications,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleNotificationClick = async () => {
    if (notificationPermission === "unsupported") {
      setNotificationMessage("Browser notifications are not supported here.");
      return;
    }

    if (notificationsEnabled && notificationPermission === "granted") {
      await disableNotifications();
      setNotificationMessage("Notifications disabled.");
      return;
    }

    const result = await requestNotificationAccess();
    if (result.status === "granted") {
      setNotificationMessage("Notifications enabled.");
    } else if (result.status === "denied") {
      setNotificationMessage("Browser blocked notifications.");
    } else {
      setNotificationMessage("Notification permission was dismissed.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-on-background font-body-main antialiased overflow-hidden">
      {/* Sidebar Nav (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-xl py-lg px-md shrink-0 shadow-xl z-50">
        <div className="flex items-center gap-md mb-xl px-sm cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
            <AppIcon name="security" className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-on-surface leading-none">BiasGuard X</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1 opacity-60">Calculated Clarity</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-xs overflow-y-auto pr-xs custom-scrollbar">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-sm rounded-xl transition-all duration-300 font-label-caps text-[11px] font-bold uppercase tracking-tight ${
                  isActive 
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/10 border border-primary" 
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border border-transparent"
                }`
              }
            >
              <AppIcon name={tab.icon} className="h-5 w-5" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-lg border-t border-outline-variant/30 flex flex-col gap-md">
          <div className="flex items-center gap-md px-sm">
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/50 overflow-hidden shrink-0 shadow-sm">
              <img 
                src={currentUser?.photoURL || "https://lh3.googleusercontent.com/a/default-user"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-on-surface truncate uppercase tracking-tighter">{currentUser?.displayName || "Anonymous"}</span>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">{role}</span>
            </div>
            <button onClick={logout} className="ml-auto text-on-surface-variant hover:text-error transition-colors">
              <AppIcon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* REFINED NAVBAR */}
        <header className="h-16 w-full flex items-center justify-between px-lg border-b border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-md">
            <button 
              className="lg:hidden p-2 hover:bg-surface-container rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <AppIcon name="more_vert" className="h-5 w-5 rotate-90" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-outline-variant/50 font-label-caps text-[10px] font-bold uppercase tracking-widest">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate("/")}>BiasGuard X</span>
              <AppIcon name="chevron_right" className="h-[14px] w-[14px]" />
              <span className="text-on-surface-variant">{title}</span>
            </div>
            <h2 className="md:hidden font-h2 text-lg text-on-surface truncate max-w-[150px]">{title}</h2>
          </div>

          <div className="flex items-center gap-md">
            {/* System Status Pill */}
            <div className="flex items-center gap-3">
              {isVaultFallback && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm animate-in fade-in zoom-in duration-500">
                   <AppIcon name="database" className="h-[14px] w-[14px] text-amber-500" />
                   <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Local Audit Vault Active</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Engine Live</span>
              </div>
            </div>
            
            {actions}

            <div className="h-8 w-px bg-outline-variant/30 mx-xs hidden sm:block" />
            
            <div className="flex items-center gap-sm">
              <div className="relative group">
                <button
                  onClick={handleNotificationClick}
                  className={`transition-colors p-1.5 rounded-lg hover:bg-primary/5 ${notificationsEnabled ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                  title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                >
                  <AppIcon name="notifications" className="h-5 w-5" />
                </button>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-surface-container-lowest ${notificationsEnabled ? "bg-primary" : "bg-error"}`} />
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5">
                <AppIcon name="search" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto p-md lg:p-xl relative scroll-smooth bg-surface-container-low/20">
          {networkError && (
            <div className="mb-lg p-md bg-error/5 border border-error/20 rounded-2xl flex items-center gap-md text-error animate-in slide-in-from-top-2 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                <AppIcon name="wifi_off" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-label-caps text-[11px] font-bold uppercase tracking-widest">Connectivity issues detected</p>
                <p className="font-body-sm text-xs opacity-70 mt-0.5">{networkError}</p>
              </div>
            </div>
          )}

          {notificationMessage && (
            <div className="mb-lg p-md bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-md text-primary shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <AppIcon name="notifications" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-label-caps text-[11px] font-bold uppercase tracking-widest">Notifications</p>
                <p className="font-body-sm text-xs opacity-80 mt-0.5">{notificationMessage}</p>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto">
            {/* Dynamic Breadcrumb for Title */}
            <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-h1 text-h1 text-on-surface tracking-tight">{title}</h1>
                <p className="text-on-surface-variant text-sm mt-1 max-w-xl opacity-70">
                  Manage your algorithmic governance, analyze model parameters, and ensure cross-demographic fairness.
                </p>
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>

            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-72 h-full bg-surface-container-lowest p-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-xl">
              <div className="flex items-center gap-md">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-lg">
                  <AppIcon name="security" className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-on-surface leading-none">BiasGuard X</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant">
                <AppIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-sm">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-md px-md py-sm rounded-xl transition-all font-label-caps text-[11px] font-bold uppercase ${
                      isActive ? "bg-primary text-on-primary" : "text-on-surface-variant"
                    }`
                  }
                >
                  <AppIcon name={tab.icon} className="h-5 w-5" />
                  <span>{tab.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
