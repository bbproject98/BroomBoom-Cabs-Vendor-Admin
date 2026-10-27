"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Key,
  CreditCard,
  Edit,
  Clock,
  User,
  Building2,
  Car,
  Ticket,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  History,
  Layers,
  ChevronRight,
} from "lucide-react";
import { AdminActivityLog, ProfileActivityGroup } from "@/types";
import { formatDate, getWhatsAppLink } from "@/lib/utils";

export default function ActivityLogsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [profileGroups, setProfileGroups] = useState<ProfileActivityGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  // View mode: 'profile' (Name + Phone + Previous Activity dropdown) or 'flat' (Raw timeline)
  const [viewMode, setViewMode] = useState<"profile" | "flat">("profile");

  // Map of profile entityId to boolean (expanded/collapsed state for Previous Activity dropdown)
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("actionType", actionFilter);
      if (entityFilter !== "all") params.append("entityType", entityFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      params.append("limit", "250");

      const res = await fetch(`/api/activity?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setTotal(data.total || data.logs.length);
        if (Array.isArray(data.profileGroups)) {
          setProfileGroups(data.profileGroups);
        }
      }
    } catch (e) {
      console.error("Error fetching activity logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle "Previous Activity" dropdown for a specific profile
  const togglePreviousActivity = (entityKey: string) => {
    setExpandedProfiles((prev) => ({
      ...prev,
      [entityKey]: !prev[entityKey],
    }));
  };

  const expandAllProfiles = () => {
    const allExpanded: Record<string, boolean> = {};
    activeGroups.forEach((g) => {
      allExpanded[g.entityId] = true;
    });
    setExpandedProfiles(allExpanded);
  };

  const collapseAllProfiles = () => {
    setExpandedProfiles({});
  };

  const handleClearLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all admin activity logs? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/activity", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        setProfileGroups([]);
        setTotal(0);
      }
    } catch (e) {
      alert("Failed to clear activity logs.");
    }
  };

  const exportCsv = () => {
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }
    const headers = [
      "Timestamp",
      "Admin Actor",
      "Action Type",
      "Entity Type",
      "Entity ID",
      "Person Name",
      "Person Phone",
      "Title",
      "Details",
    ];
    const rows = logs.map((l) => [
      `"${l.createdAt}"`,
      `"${l.adminName}"`,
      `"${l.actionType}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${(l.personName || "").replace(/"/g, '""')}"`,
      `"${(l.personPhone || "").replace(/"/g, '""')}"`,
      `"${(l.title || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `broomboom-admin-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const updateCount = logs.filter((l) => l.actionType === "UPDATE").length;
  const statusCount = logs.filter(
    (l) => l.actionType === "STATUS_CHANGE" || l.actionType === "APPROVE"
  ).length;
  const paymentCount = logs.filter((l) => l.actionType === "PAYMENT_RECORDED").length;
  const credsCount = logs.filter((l) => l.actionType.includes("CREDENTIALS")).length;
  const deleteCount = logs.filter((l) => l.actionType === "DELETE").length;

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE":
        return {
          label: "Approved",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
          icon: ShieldCheck,
        };
      case "REJECT":
        return {
          label: "Rejected",
          badge: "bg-rose-50 text-rose-800 border-rose-300 font-bold",
          icon: AlertCircle,
        };
      case "PAYMENT_RECORDED":
        return {
          label: "Payment Recorded",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
          icon: CreditCard,
        };
      case "STATUS_CHANGE":
        return {
          label: "Status Changed",
          badge: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
          icon: CheckCircle2,
        };
      case "CREDENTIALS_GENERATED":
      case "CREDENTIALS_RESET":
      case "CREDENTIALS_UPDATED":
        return {
          label: "Credentials",
          badge: "bg-purple-50 text-purple-700 border-purple-200 font-semibold",
          icon: Key,
        };
      case "DELETE":
        return {
          label: "Deleted",
          badge: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
          icon: Trash2,
        };
      case "TICKET_APPROVED":
        return {
          label: "Ticket Approved",
          badge: "bg-teal-50 text-teal-700 border-teal-200 font-semibold",
          icon: Ticket,
        };
      case "TICKET_REJECTED":
        return {
          label: "Ticket Rejected",
          badge: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
          icon: AlertCircle,
        };
      case "UPDATE":
      default:
        return {
          label: "Updated",
          badge: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
          icon: Edit,
        };
    }
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    if (entityType === "vendor" || entityType === "credential") {
      return `/vendor/manage/${entityId}`;
    }
    if (entityType === "franchise") {
      return `/franchise`;
    }
    if (entityType === "ticket") {
      return `/vendor?tab=tickets`;
    }
    return null;
  };

  // Build client-side fallback groups if profileGroups from API was empty
  const activeGroups = useMemo<ProfileActivityGroup[]>(() => {
    if (profileGroups && profileGroups.length > 0) {
      return profileGroups;
    }

    const map = new Map<string, ProfileActivityGroup>();
    logs.forEach((log) => {
      const key = (log.personPhone || log.entityId || log.id).toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          entityId: log.entityId,
          entityType: log.entityType,
          personName: log.personName || "Valued Partner",
          personPhone: log.personPhone || "—",
          profileLink: getEntityLink(log.entityType, log.entityId) || undefined,
          activities: [],
          lastActivityAt: log.createdAt,
        });
      }
      const g = map.get(key)!;
      g.activities.push(log);
      if (new Date(log.createdAt).getTime() > new Date(g.lastActivityAt).getTime()) {
        g.lastActivityAt = log.createdAt;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  }, [profileGroups, logs]);

  const anyExpanded = Object.values(expandedProfiles).some(Boolean);

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={franchiseCount}
        vendorSubCount={subCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Admin Activity & Audit Logs"
          subtitle="Track all admin changes, previous activities, payments, and approvals per profile"
          onRefresh={fetchLogs}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Breadcrumbs & Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-800">Admin Activity Logs</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "profile" ? "flat" : "profile")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {viewMode === "profile"
                    ? "Switch to Flat Timeline"
                    : "Switch to Profile View"}
                </span>
              </button>

              {viewMode === "profile" && activeGroups.length > 0 && (
                <button
                  type="button"
                  onClick={anyExpanded ? collapseAllProfiles : expandAllProfiles}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  {anyExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All Previous</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Profiles
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {activeGroups.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Admin Actions
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {total}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Payments Recorded
              </span>
              <div className="text-xl sm:text-2xl font-bold text-teal-600 mt-1">
                {paymentCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Credentials Issued
              </span>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                {credsCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Status &amp; Approvals
              </span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                {statusCount}
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Person Name, Phone Number, App ID, or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Entity Filter & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Modules</option>
                  <option value="vendor">Vendor Leads</option>
                  <option value="franchise">Franchise Leads</option>
                  <option value="credential">Credentials Desk</option>
                  <option value="subscription">Subscriptions</option>
                  <option value="ticket">Plan Tickets</option>
                </select>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Export Activity Logs as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-all cursor-pointer"
                  title="Clear all logs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar text-xs">
              {[
                { key: "all", label: "All Activities" },
                { key: "APPROVE", label: "Approvals" },
                { key: "PAYMENT_RECORDED", label: "Payments Recorded" },
                { key: "STATUS_CHANGE", label: "Status Changes" },
                { key: "UPDATE", label: "Field Updates" },
                { key: "CREDENTIALS_GENERATED", label: "Credentials" },
                { key: "REJECT", label: "Rejections" },
                { key: "DELETE", label: "Deletions" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setActionFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                    actionFilter === pill.key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW MODE 1: PROFILE CENTRIC (NAME + PHONE + PREVIOUS ACTIVITY DROPDOWN) */}
          {/* ========================================================================= */}
          {viewMode === "profile" && (
            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Loading Profile Activities...</p>
                </div>
              ) : activeGroups.length > 0 ? (
                activeGroups.map((group) => {
                  const isExpanded = !!expandedProfiles[group.entityId];
                  const hasValidPhone = group.personPhone && group.personPhone !== "—";

                  return (
                    <div
                      key={group.entityId}
                      className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Profile Card Header: Name, Phone Number, and "Previous Activity" Button */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Name & Phone Number */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {group.personName.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0 space-y-1">
                            {/* Person Name & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {group.personName}
                              </h3>

                              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-semibold border border-slate-200">
                                {group.entityId}
                              </span>

                              {group.status && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                    group.status === "approved"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : group.status === "in_progress"
                                      ? "bg-purple-50 text-purple-700 border-purple-300"
                                      : group.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-300"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {group.status}
                                </span>
                              )}

                              {group.planTier && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                  {group.planTier} Partner
                                </span>
                              )}
                            </div>

                            {/* Phone Number & Direct Contact Actions */}
                            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                {hasValidPhone ? (
                                  <a
                                    href={`tel:${group.personPhone}`}
                                    className="hover:text-emerald-600 hover:underline font-mono"
                                    title="Call Phone Number"
                                  >
                                    {group.personPhone}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-mono">—</span>
                                )}
                              </div>

                              {hasValidPhone && (
                                <a
                                  href={getWhatsAppLink(
                                    group.personPhone,
                                    group.personName,
                                    group.entityId,
                                    group.entityType === "franchise" ? "Franchise" : "Vendor"
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200 transition-colors"
                                  title="WhatsApp Chat"
                                >
                                  <MessageCircle className="w-3 h-3 text-[#25D366]" />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {group.city && (
                                <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {group.city}
                                    {group.state ? `, ${group.state}` : ""}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: "Previous Activity" Button & Profile Link */}
                        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                          {group.profileLink && (
                            <Link
                              href={group.profileLink}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                              title="Open Full Profile Page"
                            >
                              <span>Manage Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}

                          {/* EXACT SECTION REQUESTED: "Previous Activity" Dropdown Button */}
                          <button
                            type="button"
                            onClick={() => togglePreviousActivity(group.entityId)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                              isExpanded
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                            }`}
                            title="Click to view previous activities for this profile"
                          >
                            <History className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Previous Activity</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                isExpanded
                                  ? "bg-white/20 text-white"
                                  : "bg-emerald-200 text-emerald-900"
                              }`}
                            >
                              {group.activities.length}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* PREVIOUS ACTIVITY DROPDOWN (OPENS WHEN CLICKED)           */}
                      {/* ========================================================= */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200/60">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-600">
                              <History className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Previous Activity Log for {group.personName}</span>
                              <span className="text-slate-400 font-normal">
                                ({group.activities.length} total changes)
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              Latest change: {formatDate(group.lastActivityAt)}
                            </span>
                          </div>

                          {/* List of Previous Changes in this Profile */}
                          <div className="space-y-2.5">
                            {group.activities.map((act) => {
                              const badge = getActionBadge(act.actionType);
                              const Icon = badge.icon;
                              const entityUrl = getEntityLink(act.entityType, act.entityId);

                              return (
                                <div
                                  key={act.id}
                                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div
                                      className={`p-2 rounded-lg border shrink-0 ${badge.badge}`}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.badge}`}
                                        >
                                          {badge.label}
                                        </span>

                                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                                          #{act.id}
                                        </span>

                                        {entityUrl && (
                                          <Link
                                            href={entityUrl}
                                            className="text-[11px] font-mono text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                                          >
                                            <span>{act.entityId}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Link>
                                        )}
                                      </div>

                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                        {act.title}
                                      </h4>

                                      {act.details && (
                                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono whitespace-pre-wrap break-words leading-relaxed">
                                          {act.details}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="sm:text-right shrink-0 pt-1 sm:pt-0 space-y-1">
                                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      <span>{act.adminName}</span>
                                    </div>
                                    <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatDate(act.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Activity Logs Found</h4>
                  <p className="text-xs text-slate-500">
                    {searchQuery || actionFilter !== "all" || entityFilter !== "all"
                      ? "Try adjusting your search query or filters."
                      : "Admin actions like status updates, dynamic payments, and deletions will appear here."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: FLAT TIMELINE FEED (OPTIONAL TOGGLE)                         */}
          {/* ========================================================================= */}
          {viewMode === "flat" && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Loading Activity Timeline...</p>
                </div>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const badgeInfo = getActionBadge(log.actionType);
                  const IconComponent = badgeInfo.icon;
                  const linkHref = getEntityLink(log.entityType, log.entityId);

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${badgeInfo.badge}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeInfo.badge}`}
                            >
                              {badgeInfo.label}
                            </span>

                            {log.personName && (
                              <span className="text-xs font-bold text-slate-800">
                                {log.personName}
                              </span>
                            )}

                            {log.personPhone && log.personPhone !== "—" && (
                              <span className="text-xs font-mono text-slate-500">
                                ({log.personPhone})
                              </span>
                            )}

                            {linkHref ? (
                              <Link
                                href={linkHref}
                                className="font-mono text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>{log.entityId}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            ) : (
                              <span className="font-mono text-xs font-bold text-slate-700">
                                {log.entityId}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {log.title}
                          </h4>

                          {log.details && (
                            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono whitespace-pre-wrap break-words leading-relaxed">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0 pt-1 sm:pt-0 space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{log.adminName}</span>
                        </div>
                        <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Activity Logs Found</h4>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query or filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
