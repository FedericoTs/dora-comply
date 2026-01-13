"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Building2,
  Users,
  Settings,
  LayoutDashboard,
  Moon,
  Sun,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Filter,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";

import {
  NavItem,
  StatCard,
  ActivityItem,
  RiskRow,
  VendorRow,
  ColorSwatch,
} from "./components";

export default function ThemePage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">DORA Comply</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <NavItem icon={Building2} label="Vendors" count={147} />
            <NavItem icon={FileText} label="Documents" />
            <NavItem icon={BarChart3} label="Reports" />
            <NavItem icon={Shield} label="RoI Export" badge="New" />

            <div className="pt-6 pb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                Settings
              </span>
            </div>
            <NavItem icon={Users} label="Team" />
            <NavItem icon={Settings} label="Settings" />
          </nav>

          {/* User */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">SJ</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Compliance Lead</p>
              </div>
              <button className="icon-btn">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Bar */}
          <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-80 pl-10 pr-4 py-2 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="icon-btn relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <button
                className="icon-btn"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-8">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8 animate-in">
              <div>
                <h1 className="mb-1">Good morning, Sarah</h1>
                <p className="text-muted-foreground">
                  Here&apos;s what&apos;s happening with your compliance program today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add vendor
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8 stagger">
              <StatCard
                label="Total Vendors"
                value="147"
                change="+12%"
                trend="up"
                period="vs last month"
              />
              <StatCard
                label="RoI Readiness"
                value="94%"
                change="+3%"
                trend="up"
                period="vs last week"
              />
              <StatCard
                label="Critical Risks"
                value="8"
                change="-2"
                trend="down"
                period="from yesterday"
              />
              <StatCard
                label="Days to Deadline"
                value="42"
                subtitle="April 30, 2026"
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="col-span-2 card-premium p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h3>Recent Activity</h3>
                  <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    View all
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-0">
                  <ActivityItem
                    title="SOC 2 Type II report uploaded"
                    vendor="Acme Cloud Services"
                    time="2 hours ago"
                    type="success"
                  />
                  <ActivityItem
                    title="Risk assessment completed"
                    vendor="TechVendor Inc"
                    time="5 hours ago"
                    type="success"
                  />
                  <ActivityItem
                    title="Certificate expiring in 30 days"
                    vendor="DataProcessor EU"
                    time="1 day ago"
                    type="warning"
                  />
                  <ActivityItem
                    title="New vendor added"
                    vendor="SecureAuth Pro"
                    time="2 days ago"
                    type="info"
                  />
                  <ActivityItem
                    title="Questionnaire submitted"
                    vendor="CloudDB Systems"
                    time="3 days ago"
                    type="success"
                  />
                </div>
              </div>

              {/* Deadline Card */}
              <div className="card-premium p-6 animate-slide-up">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">RoI Submission</span>
                </div>
                <div className="mb-6">
                  <div className="text-5xl font-semibold tracking-tight mb-1">42</div>
                  <div className="text-muted-foreground">days remaining</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "72%" }} />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-accent">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">On track</p>
                      <p className="text-xs text-muted-foreground">
                        You&apos;re ahead of schedule. Keep up the great work!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendors by Risk */}
              <div className="card-premium p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h3>Vendors by Risk</h3>
                  <button className="icon-btn">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <RiskRow label="Critical" count={8} total={147} color="bg-error" />
                  <RiskRow label="High" count={23} total={147} color="bg-warning" />
                  <RiskRow label="Medium" count={45} total={147} color="bg-chart-5" />
                  <RiskRow label="Low" count={71} total={147} color="bg-success" />
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="col-span-2 card-premium p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h3>Pending Reviews</h3>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-default">23 pending</span>
                    <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                      View all
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <table className="table-premium">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Due</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <VendorRow
                        name="SecureAuth Pro"
                        type="Identity Provider"
                        priority="High"
                        due="2 days"
                      />
                      <VendorRow
                        name="CloudDB Systems"
                        type="Database"
                        priority="Medium"
                        due="5 days"
                      />
                      <VendorRow
                        name="PayFlow API"
                        type="Payment Processing"
                        priority="High"
                        due="3 days"
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Design System Section */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="mb-8">
                <h2 className="mb-2">Design System</h2>
                <p className="text-muted-foreground">
                  Components and tokens for the DORA Comply design system.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Colors */}
                <div className="card-elevated p-6">
                  <h4 className="mb-4">Colors</h4>
                  <div className="space-y-3">
                    <ColorSwatch
                      name="Primary"
                      color="bg-primary"
                      value="#059669"
                    />
                    <ColorSwatch
                      name="Success"
                      color="bg-success"
                      value="#10B981"
                    />
                    <ColorSwatch
                      name="Warning"
                      color="bg-warning"
                      value="#F59E0B"
                    />
                    <ColorSwatch
                      name="Error"
                      color="bg-error"
                      value="#EF4444"
                    />
                    <ColorSwatch
                      name="Info"
                      color="bg-info"
                      value="#3B82F6"
                    />
                  </div>
                </div>

                {/* Typography */}
                <div className="card-elevated p-6">
                  <h4 className="mb-4">Typography</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Display</p>
                      <p className="text-4xl font-semibold tracking-tight">Aa</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Heading</p>
                      <p className="text-2xl font-semibold">Aa</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Body</p>
                      <p className="text-base">Plus Jakarta Sans</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Caption</p>
                      <p className="text-sm text-muted-foreground">Secondary text</p>
                    </div>
                  </div>
                </div>

                {/* Components */}
                <div className="card-elevated p-6">
                  <h4 className="mb-4">Components</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Buttons</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-primary text-sm py-2 px-4">Primary</button>
                        <button className="btn-secondary text-sm py-2 px-4">Secondary</button>
                        <button className="btn-ghost text-sm py-2 px-4">Ghost</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Badges</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="badge badge-default">Default</span>
                        <span className="badge badge-primary">Primary</span>
                        <span className="badge badge-success">Success</span>
                        <span className="badge badge-warning">Warning</span>
                        <span className="badge badge-error">Error</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Input</p>
                      <input
                        type="text"
                        placeholder="Enter text..."
                        className="input-premium text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
