"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { VendorSubscriptionDetailModal } from "@/components/VendorSubscriptionDetailModal";
import {
  Search,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { VendorSubscription, SubscriptionStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export default function VendorSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<VendorSubscription[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    pending: number;
    paid: number;
    totalRevenue: number;
  }>({
    total: 0,
    active: 0,
    pending: 0,
    paid: 0,
    totalRevenue: 0,
  });

  const [leadCount, setLeadCount] = useState(0);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [pendingTicketCount, setPendingTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const [selectedSub, setSelectedSub] = useState<VendorSubscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/vendor/subscriptions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }

      // Also get vendor leads count for sidebar badge
      const leadsRes = await fetch("/api/vendor/leads?status=all");
      const leadsData = await leadsRes.json();
      if (leadsData.success && Array.isArray(leadsData.leads)) {
        setLeadCount(leadsData.leads.length);
      }

      // Also get tickets count for sidebar badge
      const ticketRes = await fetch("/api/vendor/tickets?status=all");
      const ticketData = await ticketRes.json();
      if (ticketData.success && ticketData.counts) {
        setPendingTicketCount((ticketData.counts.pending || 0) + (ticketData.counts.paymentCompleted || 0));
      }

      // Also get franchise count for sidebar badge
      const fRes = await fetch("/api/franchise/leads");
      const fData = await fRes.json();
      if (fData.success && Array.isArray(fData.leads)) {
        setFranchiseCount(fData.leads.length);
      }
    } catch (e) {
      console.error("Failed to load vendor subscriptions:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, paymentStatusFilter, tierFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handleUpdateStatus = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? data.subscription : s))
        );
        if (selectedSub?.id === id) {
          setSelectedSub(data.subscription);
        }
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? data.subscription : s))
        );
        if (selectedSub?.id === id) {
          setSelectedSub(data.subscription);
        }
        alert("Subscription audit notes updated!");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Failed to delete subscription:", err);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={franchiseCount}
        vendorCount={leadCount}
        vendorSubCount={stats.total}
        pendingTicketCount={pendingTicketCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor Subscriptions Desk"
          subtitle="Real-time vendor partner agreements, license tiers & Cashfree payments"
          onRefresh={fetchSubscriptions}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto pb-24 lg:pb-8">
          {/* Top Aggregated Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Subscriptions
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Direct from Vendor Portal</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Active Licenses
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{stats.active}</div>
              <p className="text-[10px] sm:text-[11px] text-emerald-700/80 mt-1">Verified partner hubs</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Revenue Collected
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">{stats.paid} paid transactions</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Pending Gateway
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
              <p className="text-[10px] sm:text-[11px] text-amber-700/80 mt-1">Awaiting completion</p>
            </div>
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <form onSubmit={handleSearch} className="w-full lg:flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subscription ID, vendor name, mobile, city, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-[130px] sm:flex-none px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Licenses</option>
                <option value="pending">Pending Payment/Review</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="flex-1 min-w-[130px] sm:flex-none px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
              >
                <option value="all">All Payments</option>
                <option value="PAID">PAID</option>
                <option value="ACTIVE">ACTIVE (Order Initiated)</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="flex-1 min-w-[130px] sm:flex-none px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
              >
                <option value="all">All Plan Tiers</option>
                <option value="silver">Silver Partner (₹10,000)</option>
                <option value="gold">Gold Partner (₹20,000)</option>
                <option value="platinum">Platinum Partner (₹50,000)</option>
              </select>

              <a
                href="/api/export?type=subscriptions"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MOBILE VIEW: SUBSCRIPTION CARDS (Visible on < md) */}
          {/* ========================================================= */}
          <div className="md:hidden space-y-3">
            {subscriptions.length > 0 ? (
              subscriptions.map((sub) => {
                const isPlatinum = sub.planTier?.toLowerCase() === "platinum";
                const isGold = sub.planTier?.toLowerCase() === "gold";

                const cleanPhone = (sub.vendorMobile || "").replace(/[^0-9]/g, "");
                const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                  `Hello ${sub.vendorName}, regarding your BroomBoom Vendor Subscription (${sub.subscriptionId}).`
                )}`;

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 active:scale-[0.99] transition-all cursor-pointer hover:border-slate-300 hover:shadow-md"
                  >
                    {/* Top: ID, Created Date, Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {sub.subscriptionId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(sub.createdAt)}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : sub.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {sub.status === "active" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {sub.status === "pending" && <Clock className="w-2.5 h-2.5" />}
                        {sub.status}
                      </span>
                    </div>

                    {/* Vendor Partner info */}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{sub.vendorName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <a
                          href={`tel:${sub.vendorMobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-emerald-700 font-mono"
                        >
                          {sub.vendorMobile}
                        </a>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {sub.city}
                        </span>
                      </div>
                    </div>

                    {/* Plan, Fee & Payment */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isPlatinum
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : isGold
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {sub.planName || `${sub.planTier} Partner`}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {sub.hasExclusivity ? "Exclusivity Reserved" : (sub.billingCycle || "12 Mo Territory")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          ₹{sub.totalAmount ? Number(sub.totalAmount).toLocaleString("en-IN") : "0"}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            sub.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : sub.paymentStatus === "FAILED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {sub.paymentStatus || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${sub.vendorMobile}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsDetailOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                      >
                        <span>Audit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-900 text-sm">No vendor subscriptions found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Subscriptions created via the vendor portal or payment gateway will appear here.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP VIEW: SUBSCRIPTIONS DATA TABLE (Hidden on < md) */}
          {/* ========================================================= */}
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subscription ID</th>
                    <th className="py-3.5 px-4">Vendor Partner</th>
                    <th className="py-3.5 px-4">Location / Territory</th>
                    <th className="py-3.5 px-4">Plan & Exclusivity</th>
                    <th className="py-3.5 px-4">Total Amount (₹)</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">License Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => {
                      const isPlatinum = sub.planTier?.toLowerCase() === "platinum";
                      const isGold = sub.planTier?.toLowerCase() === "gold";

                      const cleanPhone = (sub.vendorMobile || "").replace(/[^0-9]/g, "");
                      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                      const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                        `Hello ${sub.vendorName}, regarding your BroomBoom Vendor Subscription (${sub.subscriptionId}).`
                      )}`;

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedSub(sub);
                            setIsDetailOpen(true);
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {sub.subscriptionId}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {formatDate(sub.createdAt)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-xs">{sub.vendorName}</p>
                            <p className="text-slate-600 font-mono text-[11px]">{sub.vendorMobile}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{sub.applicationId}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{sub.city}</p>
                            <p className="text-[11px] text-slate-500">
                              {sub.state || "India"}
                            </p>
                            {sub.territoryScope && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {sub.territoryScope}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isPlatinum
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : isGold
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {sub.planName || `${sub.planTier} Partner`}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {sub.hasExclusivity ? "Exclusivity Reserved" : (sub.billingCycle || "12 Mo Territory")}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              ₹{sub.totalAmount ? Number(sub.totalAmount).toLocaleString("en-IN") : "0"}
                            </span>
                            {sub.gstAmount && Number(sub.gstAmount) > 0 && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Incl. GST ₹{Number(sub.gstAmount).toLocaleString("en-IN")}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                sub.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : sub.paymentStatus === "FAILED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {sub.paymentStatus || "PENDING"}
                            </span>
                            {sub.cfOrderId && (
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[110px] mt-0.5">
                                {sub.cfOrderId}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={sub.status}
                              onChange={(e) =>
                                handleUpdateStatus(sub.id, e.target.value as SubscriptionStatus)
                              }
                              className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border bg-white focus:outline-none cursor-pointer ${
                                sub.status === "active"
                                  ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                                  : sub.status === "pending"
                                  ? "text-amber-700 border-amber-300 bg-amber-50"
                                  : sub.status === "expired"
                                  ? "text-slate-600 border-slate-200 bg-slate-50"
                                  : "text-rose-700 border-rose-300 bg-rose-50"
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="expired">Expired</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#25D366]/20 text-slate-600 hover:text-[#25D366] transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setIsDetailOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                                title="View details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-slate-800">No vendor subscriptions found</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Subscriptions created via the vendor portal or payment gateway will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Subscription Detail Modal */}
      <VendorSubscriptionDetailModal
        subscription={selectedSub}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSub(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDelete}
      />
    </div>
  );
}
