"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Plus,
  Minus,
  Search,
  Filter,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
  Coins,
  AlertCircle,
  Building2,
  MapPin,
  Check,
} from "lucide-react";
import { VendorLead, WalletTransaction, WalletStats } from "@/types";
import { formatDate, formatDateTime, calculateVendorCancellationFee, getWhatsAppLink } from "@/lib/utils";

export default function VendorWalletPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [subCount, setSubCount] = useState(0);

  const [vendors, setVendors] = useState<VendorLead[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalVendors: 0,
    totalBalance: 0,
    fundedVendors: 0,
    zeroBalanceVendors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all"); // 'all' | 'positive' | 'zero'
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State for Credit / Debit / Set Balance
  const [walletModal, setWalletModal] = useState<{
    vendor: VendorLead;
    type: "CREDIT" | "DEBIT" | "SET";
  } | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionRemarks, setActionRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Cancellation Charge Calculator state (inside DEBIT modal)
  const [cancelFareInput, setCancelFareInput] = useState("");
  const cancelCalculation = useMemo(() => {
    const fare = parseFloat(cancelFareInput);
    if (!fare || fare <= 0) return null;
    return calculateVendorCancellationFee(fare);
  }, [cancelFareInput]);
  const cancelCharge = cancelCalculation ? cancelCalculation.fee : null;

  // Modal State for Viewing Transaction History
  const [historyModalVendor, setHistoryModalVendor] = useState<VendorLead | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (balanceFilter !== "all") params.append("balance", balanceFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/vendor/wallet?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.vendors)) {
        setVendors(data.vendors);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching vendor wallets:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Fetch sidebar counters
    fetch("/api/vendor/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.subscriptions)) setSubCount(d.subscriptions.length);
      })
      .catch(() => {});

    fetch("/api/franchise/leads")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.leads)) setFranchiseCount(d.leads.length);
      })
      .catch(() => {});
  }, [tierFilter, balanceFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWalletData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  // Open History Modal and fetch transactions
  const openHistoryModal = async (vendor: VendorLead) => {
    setHistoryModalVendor(vendor);
    try {
      setLoadingHistory(true);
      const res = await fetch(
        `/api/vendor/wallet/transactions?applicationId=${encodeURIComponent(vendor.applicationId)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
      setTransactions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Wallet Update (Credit, Debit, Set Balance)
  const handleWalletAction = async () => {
    if (!walletModal) return;
    const val = Number(actionAmount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await fetch("/api/vendor/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: walletModal.vendor.applicationId,
          type: walletModal.type,
          amount: val,
          remarks: actionRemarks.trim() || undefined,
          adminName: "Super Admin (HQ)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "Wallet updated successfully!");
        setWalletModal(null);
        setActionAmount("");
        setActionRemarks("");
        setCancelFareInput("");
        await fetchWalletData();
      } else {
        alert(data.error || "Failed to update wallet balance.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to update wallet balance.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (vendors.length === 0) {
      alert("No vendors found to export.");
      return;
    }
    const headers = [
      "Vendor Name",
      "Mobile Number",
      "Application ID",
      "Package Tier",
      "Status",
      "City",
      "Wallet Amount (INR)",
    ];
    const rows = vendors.map((v) => [
      `"${v.fullName}"`,
      `"${v.mobile}"`,
      `"${v.applicationId}"`,
      `"${(v.preferredPackage || "silver").toUpperCase()}"`,
      `"${v.status}"`,
      `"${v.city}"`,
      Number(v.walletBalance || 0),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `broomboom-vendor-wallets-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          title="Vendor Wallets & Balance HQ"
          subtitle="View, credit, debit & manage live wallet reserves for all listed vendors"
          onRefresh={fetchWalletData}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/vendor" className="hover:text-slate-800 transition-colors">
                Vendor
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-800">Vendor Wallets</span>
            </div>

            {notificationMsg && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{notificationMsg}</span>
              </div>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Listed Vendors
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalVendors}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/30 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Total Wallet Reserves
                </span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                  ₹{stats.totalBalance.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Funded Wallets (&gt; ₹0)
                </span>
                <div className="text-xl sm:text-2xl font-bold text-teal-600 mt-1">
                  {stats.fundedVendors}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Zero Balance Wallets
                </span>
                <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                  {stats.zeroBalanceVendors}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
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
                  placeholder="Search by Vendor Name, Phone Number, or Application ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Filters & Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Plan Tiers</option>
                  <option value="silver">Silver Partner</option>
                  <option value="gold">Gold Partner</option>
                  <option value="platinum">Platinum Partner</option>
                </select>

                <select
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Balance Status</option>
                  <option value="positive">Funded Wallets (&gt; ₹0)</option>
                  <option value="zero">Zero Balance (₹0)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Application Status</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="new">New</option>
                </select>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Export Wallet Ledger as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vendor Wallets List Table & Mobile Cards */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Vendor Partner</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">App ID &amp; Tier</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Wallet Amount</th>
                    <th className="py-3.5 px-4 text-center">Manage Wallet</th>
                    <th className="py-3.5 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="font-semibold text-xs">Loading vendor wallets...</span>
                      </td>
                    </tr>
                  ) : vendors.length > 0 ? (
                    vendors.map((vendor) => {
                      const balance = Number(vendor.walletBalance || 0);
                      const isFunded = balance > 0;
                      const hasValidPhone = vendor.mobile && vendor.mobile !== "—";

                      return (
                        <tr
                          key={vendor.id || vendor.applicationId}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Vendor Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center justify-center shrink-0">
                                {vendor.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">
                                  {vendor.fullName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {vendor.city}
                                  {vendor.state ? `, ${vendor.state}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Phone Number & Direct Contact */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <a
                                href={`tel:${vendor.mobile}`}
                                className="font-mono font-bold text-slate-800 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{vendor.mobile}</span>
                              </a>
                              {hasValidPhone && (
                                <div>
                                  <a
                                    href={getWhatsAppLink(
                                      vendor.mobile,
                                      vendor.fullName,
                                      vendor.applicationId,
                                      "Vendor"
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                  >
                                    <MessageCircle className="w-2.5 h-2.5 text-[#25D366]" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* App ID & Tier */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                              {vendor.applicationId}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                                {vendor.preferredPackage || "silver"} Partner
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                vendor.status === "approved"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : vendor.status === "in_progress"
                                  ? "bg-purple-50 text-purple-800 border-purple-300"
                                  : vendor.status === "pending"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>

                          {/* WALLET AMOUNT (EXACT DISPLAY) */}
                          <td className="py-3.5 px-4 text-right">
                            <div
                              className={`inline-flex flex-col items-end px-3 py-1.5 rounded-xl border font-mono ${
                                isFunded
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                                  : "bg-slate-50 text-slate-600 border-slate-200 font-semibold"
                              }`}
                            >
                              <span className="text-sm font-bold">
                                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
                                {isFunded ? "Active Reserve" : "Zero Balance"}
                              </span>
                            </div>
                          </td>

                          {/* Manage Wallet Buttons (+ Credit, - Debit, Set) */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                              <button
                                type="button"
                                onClick={() => setWalletModal({ vendor, type: "CREDIT" })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                title="Add funds / Credit vendor wallet"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Credit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setWalletModal({ vendor, type: "DEBIT" })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-all cursor-pointer"
                                title="Deduct / Debit funds from vendor wallet"
                              >
                                <Minus className="w-3 h-3" />
                                <span>Debit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openHistoryModal(vendor)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
                                title="View wallet transaction history"
                              >
                                <History className="w-3 h-3 text-slate-500" />
                              </button>
                            </div>
                          </td>

                          {/* Link to Manage */}
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/vendor/manage/${vendor.id || vendor.applicationId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Wallet className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-800">No vendors found</p>
                        <p className="text-xs text-slate-500">
                          Try adjusting your search query or filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Visible on < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Loading vendor wallets...</p>
                </div>
              ) : vendors.length > 0 ? (
                vendors.map((vendor) => {
                  const balance = Number(vendor.walletBalance || 0);
                  const isFunded = balance > 0;

                  return (
                    <div key={vendor.id || vendor.applicationId} className="p-4 space-y-3">
                      {/* Top row: Name & Wallet Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{vendor.fullName}</h4>
                          <a
                            href={`tel:${vendor.mobile}`}
                            className="font-mono text-xs text-slate-600 hover:text-emerald-600 inline-flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{vendor.mobile}</span>
                          </a>
                        </div>

                        {/* WALLET AMOUNT */}
                        <div
                          className={`text-right px-2.5 py-1 rounded-xl border font-mono ${
                            isFunded
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span className="text-sm font-bold block">
                            ₹{balance.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
                            Wallet
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {vendor.applicationId}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {vendor.preferredPackage || "silver"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            vendor.status === "approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setWalletModal({ vendor, type: "CREDIT" })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Credit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setWalletModal({ vendor, type: "DEBIT" })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                            <span>Debit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openHistoryModal(vendor)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700"
                            title="Transaction History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <Link
                          href={`/vendor/manage/${vendor.id || vendor.applicationId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No vendors found</div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: CREDIT / DEBIT / SET WALLET BALANCE                              */}
        {/* ========================================================================= */}
        {walletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      walletModal.type === "CREDIT"
                        ? "bg-emerald-100 text-emerald-700"
                        : walletModal.type === "DEBIT"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {walletModal.type === "CREDIT" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : walletModal.type === "DEBIT" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {walletModal.type === "CREDIT"
                        ? "Credit / Add Funds to Wallet"
                        : walletModal.type === "DEBIT"
                        ? "Debit / Deduct Funds from Wallet"
                        : "Set Custom Wallet Balance"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {walletModal.vendor.fullName} ({walletModal.vendor.applicationId})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWalletModal(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Balance Display */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Current Wallet Balance</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    ₹{Number(walletModal.vendor.walletBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Phone Number</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {walletModal.vendor.mobile}
                  </span>
                </div>
              </div>

              {/* ── CANCELLATION CHARGE CALCULATOR (DEBIT only) ── */}
              {walletModal.type === "DEBIT" && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                      Cancellation Charge Calculator
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-relaxed">
                    Policy: <strong>₹100 or 10% of total fare — whichever is higher.</strong>
                    <br />Enter trip fare below to auto-calculate and apply the charge.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="Enter trip fare (e.g. 850)"
                        value={cancelFareInput}
                        onChange={(e) => setCancelFareInput(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-rose-200 text-xs font-mono text-slate-800 font-bold focus:outline-none focus:border-rose-500 transition-all"
                      />
                    </div>
                    {cancelCharge !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionAmount(String(cancelCharge));
                          setActionRemarks(`Cancellation charge applied: ₹100 or 10% of ₹${cancelFareInput} fare = ₹${cancelCharge} (whichever is higher)`);
                        }}
                        className="shrink-0 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                      >
                        Apply ₹{cancelCharge.toLocaleString("en-IN")}
                      </button>
                    )}
                  </div>
                  {cancelCharge !== null && (
                    <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-rose-600" />
                      Charge = max(₹100, 10% of ₹{parseFloat(cancelFareInput).toLocaleString("en-IN")}) = <strong>₹{cancelCharge.toLocaleString("en-IN")}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {walletModal.type === "SET" ? "New Total Balance (₹) *" : "Amount to " + walletModal.type.toLowerCase() + " (₹) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={actionAmount}
                    onChange={(e) => setActionAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActionAmount(String(preset))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer font-mono"
                    >
                      +₹{preset.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Remarks / Audit Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Direct bank recharge confirmed, bonus promotional credit..."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWalletModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>                <button
                  type="button"
                  disabled={submittingAction || !actionAmount || Number(actionAmount) <= 0}
                  onClick={handleWalletAction}
                  className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    walletModal.type === "CREDIT"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : walletModal.type === "DEBIT"
                      ? "bg-rose-600 hover:bg-rose-500"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {submittingAction
                    ? "Updating..."
                    : walletModal.type === "CREDIT"
                    ? "Confirm Credit (+)"
                    : walletModal.type === "DEBIT"
                    ? "Confirm Debit (-)"
                    : "Confirm Balance"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: VENDOR WALLET TRANSACTION HISTORY                                */}
        {/* ========================================================================= */}
        {historyModalVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <History className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Wallet Ledger &amp; History
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {historyModalVendor.fullName} • {historyModalVendor.mobile} •{" "}
                      {historyModalVendor.applicationId}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryModalVendor(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current balance card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-800 font-semibold block text-[11px]">
                    Current Wallet Balance
                  </span>
                  <span className="text-lg font-bold text-emerald-950 font-mono">
                    ₹{Number(historyModalVendor.walletBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const v = historyModalVendor;
                    setHistoryModalVendor(null);
                    setWalletModal({ vendor: v, type: "CREDIT" });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  + Add Funds
                </button>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingHistory ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Loading ledger transactions...</p>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            tx.type === "CREDIT"
                              ? "bg-emerald-100 text-emerald-700"
                              : tx.type === "DEBIT"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {tx.type === "CREDIT" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : tx.type === "DEBIT" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <Wallet className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                tx.type === "CREDIT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.type === "DEBIT"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {tx.type}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              ₹{Number(tx.amount).toLocaleString("en-IN")}
                            </span>
                          </div>
                          {tx.remarks && (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {tx.remarks}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 mt-1">
                            <span className="inline-flex items-center gap-1 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                              <Clock className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{formatDateTime(tx.createdAt)}</span>
                            </span>
                            <span className="text-slate-400">By {tx.adminName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[11px]">
                        <span className="text-slate-400 block text-[10px]">New Balance</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(tx.newBalance).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No wallet transactions recorded yet for this vendor.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setHistoryModalVendor(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
