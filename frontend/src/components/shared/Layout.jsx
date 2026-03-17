/**
 * Shared Layout Components
 * Owner: Frontend Dev 1
 * 
 * Reusable layout primitives used by all dashboard modules.
 */

import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings,
  LogOut, Shield, Send, Eye, Megaphone, Globe, Bot,
} from "lucide-react";

// ─── Protected Route ─────────────────────────────────────────────────────────

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
}

// ─── Sidebar Navigation ──────────────────────────────────────────────────────

const NAV_BY_ROLE = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Create Campaign", icon: Megaphone, path: "/admin/create" },
    { label: "User Management", icon: Users, path: "/admin/users" },
    { label: "My Company", icon: FileText, path: "/admin/company" },
    { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  ],
  reviewer: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/reviewer" },
    { label: "Review Queue", icon: Eye, path: "/reviewer/queue" },
    { label: "Analytics", icon: BarChart3, path: "/reviewer/analytics" },
  ],
  ethics_reviewer: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/ethics" },
    { label: "Ethics Review", icon: Shield, path: "/ethics/review" },
    { label: "Documents", icon: FileText, path: "/ethics/documents" },
  ],
  publisher: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/publisher" },
    { label: "Ad Creator", icon: Megaphone, path: "/publisher/ads" },
    { label: "Website Creator", icon: Globe, path: "/publisher/website" },
    { label: "Bot Config", icon: Bot, path: "/publisher/bots" },
    { label: "Analytics", icon: BarChart3, path: "/publisher/analytics" },
  ],
};

export function Sidebar() {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navItems = NAV_BY_ROLE[role] || [];

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">MarketingAI</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{role?.replace("_", " ")} Panel</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-red-400 border-t border-gray-700 transition-colors"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </aside>
  );
}

// ─── Dashboard Layout ────────────────────────────────────────────────────────

export function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

// ─── Reusable Card ───────────────────────────────────────────────────────────

export function Card({ title, subtitle, children, actions, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  strategy_created: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  ethics_review: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
  paused: "bg-red-100 text-red-700",
  optimizing: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon && <Icon size={20} className="text-gray-400" />}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last period
        </p>
      )}
    </div>
  );
}
