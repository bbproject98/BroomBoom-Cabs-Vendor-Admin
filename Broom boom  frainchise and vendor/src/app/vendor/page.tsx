"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { VendorDetailModal } from "@/components/VendorDetailModal";
import { AddVendorLeadModal } from "@/components/AddVendorLeadModal";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Key,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Send,
  Copy,
  Check,
  X,
  ExternalLink,
  Users,
  Ticket,
  CreditCard,
  CheckCircle2,
  Clock,
  MapPin,
  History,
} from "lucide-react";
import { VendorLead, LeadStatus, PlanChangeTicket } from "@/types";
import {
  formatDate,
  getWhatsAppLink,
  getUpgradeCredentialsWhatsAppLink,
  getCredentialsWhatsAppLink,
  calculateUpgradeFees,
} from "@/lib/utils";

export default function VendorPage() {
  const router = useRouter();
  const portalUrl =
    process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || "http://localhost:3000";

  const [activeTab, setActiveTab] = useState<"leads" | "tickets">("leads");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Leads State
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const [selectedLead, setSelectedLead] = useState<VendorLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState<PlanChangeTicket[]>([]);
  const [ticketCounts, setTicketCounts] = useState({
    total: 0,
    pending: 0,
    awaitingPayment: 0,
    paymentCompleted: 0,
    approved: 0,
    rejected: 0,
  });
  const [pendingTicketCount, setPendingTicketCount] = useState(0);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");

  // Ticket Action Modal
  const [actionTicket, setActionTicket] = useState<{
    ticket: PlanChangeTicket;
    type: "approve_and_issue" | "step1_approve" | "step2_issue_creds" | "mark_paid" | "reject";
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionPaymentRef, setActionPaymentRef] = useState("");
  const [actionPaymentConfirmed, setActionPaymentConfirmed] = useState(false);
  const [processingTicket, setProcessingTicket] = useState(false);

  // Success Credential Modal after approving
  const [approvedCredsModal, setApprovedCredsModal] = useState<{
    ticket: PlanChangeTicket;
    userId: string;
    password: string;
  } | null>(null);
  const [copiedSuccessCred, setCopiedSuccessCred] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyTableCred = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Manual Payment Modal State for any Lead in the table
  const [paymentLead, setPaymentLead] = useState<VendorLead | null>(null);
  const [leadPaymentForm, setLeadPaymentForm] = useState({
    amount: "21600",
    paymentMode: "Bank Transfer (NEFT/RTGS/IMPS)",
    paymentReference: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
    setApproved: false,
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessCreds, setPaymentSuccessCreds] = useState<{
    lead: VendorLead;
    userId: string;
    password: string;
  } | null>(null);
  const [copiedPaySuccessCred, setCopiedPaySuccessCred] = useState(false);

  const openPaymentModal = (lead: VendorLead) => {
    const tierLower = (lead.preferredPackage || "gold").toLowerCase();
    const baseCost = tierLower === "silver" ? 10800 : tierLower === "platinum" ? 54000 : 21600;
    setLeadPaymentForm({
      amount: String(baseCost),
      paymentMode: "Bank Transfer (NEFT/RTGS/IMPS)",
      paymentReference: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: "",
      setApproved: lead.status !== "approved",
    });
    setPaymentLead(lead);
  };

  const handleRecordLeadPayment = async () => {
    if (!paymentLead) return;
    if (!leadPaymentForm.amount || Number(leadPaymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await fetch("/api/vendor/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: paymentLead.applicationId,
          amount: Number(leadPaymentForm.amount),
          paymentMode: leadPaymentForm.paymentMode,
          paymentReference: leadPaymentForm.paymentReference || `MANUAL-${Date.now().toString().slice(-6)}`,
          paymentDate: leadPaymentForm.paymentDate,
          notes: leadPaymentForm.notes,
          setApproved: leadPaymentForm.setApproved,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentLead(null);
        await fetchLeads();
        if (data.credentials && data.credentials.userId && data.credentials.password) {
          setPaymentSuccessCreds({
            lead: paymentLead,
            userId: data.credentials.userId,
            password: data.credentials.password,
          });
        } else {
          alert(data.message || "Manual payment recorded successfully! Lead status updated to in_progress.");
        }
      } else {
        alert(data.error || "Failed to record manual payment.");
      }
    } catch (e: any) {
      console.error("Payment submission error:", e);
      alert(e.message || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/vendor/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }

      // Also get subscription count for sidebar
      const subRes = await fetch("/api/vendor/subscriptions");
      const subData = await subRes.json();
      if (subData.success && Array.isArray(subData.subscriptions)) {
        setSubCount(subData.subscriptions.length);
      }

      // Also get franchise count for sidebar
      const fRes = await fetch("/api/franchise/leads");
      const fData = await fRes.json();
      if (fData.success && Array.isArray(fData.leads)) {
        setFranchiseCount(fData.leads.length);
      }
    } catch (e) {
      console.error("Failed to load vendor leads:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const params = new URLSearchParams();
      if (ticketStatusFilter !== "all") params.append("status", ticketStatusFilter);

      const res = await fetch(`/api/vendor/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        if (data.counts) {
          setTicketCounts(data.counts);
          setPendingTicketCount((data.counts.pending || 0) + (data.counts.paymentCompleted || 0));
        }
      }
    } catch (e) {
      console.error("Failed to load upgrade tickets:", e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "tickets") {
        setActiveTab("tickets");
      }
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchTickets();
  }, [statusFilter, tierFilter, ticketStatusFilter]);

  const handleRefreshAll = async () => {
    await fetchLeads();
    await fetchTickets();
    if (selectedLead?.id) {
      try {
        const freshRes = await fetch(`/api/vendor/leads/${selectedLead.id}`);
        const freshData = await freshRes.json();
        if (freshData.success && freshData.lead) {
          setSelectedLead(freshData.lead);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const handleUpdateTier = async (id: string, newTier: string) => {
    try {
      const res = await fetch(`/api/vendor/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredPackage: newTier }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, preferredPackage: newTier as any } : l))
        );
        if (selectedLead?.id === id) {
          const freshLead = await fetch(`/api/vendor/leads/${id}`).then((r) => r.json());
          if (freshLead.success && freshLead.lead) {
            setSelectedLead(freshLead.lead);
          } else {
            setSelectedLead((prev) => (prev ? { ...prev, preferredPackage: newTier as any } : null));
          }
        }
      }
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/vendor/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === "approved") {
          await fetchLeads();
        } else {
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
          );
        }
        if (selectedLead?.id === id) {
          const freshLead = await fetch(`/api/vendor/leads/${id}`).then((r) => r.json());
          if (freshLead.success && freshLead.lead) {
            setSelectedLead(freshLead.lead);
          } else {
            setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/vendor/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, adminNotes: notes } : l))
        );
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, adminNotes: notes } : null));
        }
        alert("Vendor notes saved successfully!");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/leads/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const handleProcessTicketAction = async () => {
    if (!actionTicket) return;
    const { ticket, type } = actionTicket;

    if ((type === "approve_and_issue" || type === "step2_issue_creds") && !actionPaymentConfirmed) {
      alert("Please confirm the verification checkbox before issuing credentials.");
      return;
    }

    try {
      setProcessingTicket(true);
      const res = await fetch("/api/vendor/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          action: type,
          adminNotes: actionNotes,
          paymentId: actionPaymentRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionTicket(null);
        setActionNotes("");
        setActionPaymentRef("");
        setActionPaymentConfirmed(false);
        handleRefreshAll();

        if (
          (type === "approve_and_issue" || type === "step2_issue_creds") &&
          data.ticket?.newUserId &&
          data.ticket?.newPassword
        ) {
          setApprovedCredsModal({
            ticket: data.ticket,
            userId: data.ticket.newUserId,
            password: data.ticket.newPassword,
          });
        } else {
          alert(data.message || `Ticket #${ticket.ticketId} processed successfully.`);
        }
      } else {
        alert(data.error || "Failed to process ticket.");
      }
    } catch (e) {
      console.error("Error processing ticket action:", e);
      alert("Failed to process ticket.");
    } finally {
      setProcessingTicket(false);
    }
  };

  const totalCount = leads.length;
  const newOrPendingCount = leads.filter((l) => l.status === "new" || l.status === "pending").length;
  const inProgressCount = leads.filter((l) => l.status === "in_progress" || l.status === "payment_completed").length;
  const approvedCount = leads.filter((l) => l.status === "approved").length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const s = (t.status || "").toUpperCase();
    if (ticketStatusFilter === "pending_all") {
      if (s === "APPROVED" || s === "COMPLETED" || s === "REJECTED") return false;
    } else if (ticketStatusFilter !== "all") {
      if (ticketStatusFilter === "APPROVED" && s !== "APPROVED" && s !== "COMPLETED") return false;
      if (ticketStatusFilter === "REJECTED" && s !== "REJECTED") return false;
      if (ticketStatusFilter === "PENDING" && s !== "PENDING") return false;
      if (ticketStatusFilter === "PAYMENT_COMPLETED" && s !== "PAYMENT_COMPLETED") return false;
    }

    if (!ticketSearchQuery.trim()) return true;
    const q = ticketSearchQuery.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(q) ||
      t.vendorName.toLowerCase().includes(q) ||
      t.vendorMobile.includes(q) ||
      t.applicationId.toLowerCase().includes(q) ||
      t.requestedPlan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={franchiseCount}
        vendorCount={totalCount}
        vendorSubCount={subCount}
        pendingTicketCount={pendingTicketCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor & Fleet Management"
          subtitle="Vendor Onboarding, Portal Access & Plan Upgrade Tickets"
          onRefresh={handleRefreshAll}
          isRefreshing={refreshing || loadingTickets}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto pb-24 lg:pb-8">
          {/* TOP TABS: Leads Desk vs Plan Upgrade Tickets */}
          <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("leads")}
              className={`shrink-0 flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "leads"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Vendor Leads Desk</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === "leads"
                    ? "bg-slate-950 text-emerald-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`shrink-0 flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "tickets"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Plan Upgrade Tickets</span>
              {pendingTicketCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {pendingTicketCount} Pending
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "tickets"
                      ? "bg-slate-950 text-amber-400"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tickets.length}
                </span>
              )}
            </button>
          </div>

          {/* ======================= TAB 1: LEADS DESK ======================= */}
          {activeTab === "leads" && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Vendors
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                    1. New / Pending
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{newOrPendingCount}</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                    2. Paid (In Progress)
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">{inProgressCount}</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                    3. Approved Fleet
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
                </div>
              </div>

              {/* Filter / Search Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <form onSubmit={handleSearch} className="w-full lg:flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by vendor name, mobile, city, or application ID..."
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
                    <option value="new">1. New Inquiry</option>
                    <option value="pending">2. Payment Pending</option>
                    <option value="in_progress">3. Paid (In Progress)</option>
                    <option value="approved">4. Approved / Active</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="flex-1 min-w-[130px] sm:flex-none px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
                  >
                    <option value="all">All Fleet Tiers</option>
                    <option value="silver">Silver Partner (1-3 Cabs)</option>
                    <option value="gold">Gold Partner (District Hub - 4-10 Cabs)</option>
                    <option value="platinum">Platinum Partner (Regional - 10+ Cabs)</option>
                  </select>

                  <a
                    href="/api/export?type=vendor"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-all shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export CSV</span>
                  </a>

                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vendor Lead</span>
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* MOBILE VIEW: LEADS CARD LIST (Visible on < md) */}
              {/* ========================================================= */}
              <div className="md:hidden space-y-3">
                {leads.length > 0 ? (
                  leads.map((lead) => {
                    const whatsApp = getWhatsAppLink(
                      lead.mobile,
                      lead.fullName,
                      lead.applicationId,
                      "Vendor"
                    );
                    const hasPendingTicket =
                      (lead.pendingTicketCount && lead.pendingTicketCount > 0) || false;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          router.push(`/vendor/manage/${lead.id}`);
                        }}
                        className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                      >
                        {/* Top: Application ID, Date & Status Dropdown */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-emerald-600 text-xs">
                              {lead.applicationId}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatDate(lead.createdAt)}
                            </p>
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-white focus:outline-none cursor-pointer ${
                                lead.status === "approved"
                                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                  : lead.status === "in_progress" || lead.status === "payment_completed"
                                  ? "text-purple-700 border-purple-200 bg-purple-50"
                                  : lead.status === "pending"
                                  ? "text-amber-700 border-amber-200 bg-amber-50"
                                  : lead.status === "rejected"
                                  ? "text-rose-700 border-rose-200 bg-rose-50"
                                  : "text-blue-700 border-blue-200 bg-blue-50"
                              }`}
                            >
                              <option value="new">1. New</option>
                              <option value="pending">2. Pending</option>
                              <option value="in_progress">3. In Progress</option>
                              <option value="approved">4. Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* Vendor Name, Upgrade badge, Contact */}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{lead.fullName}</p>
                            {hasPendingTicket && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5" />
                                Upgrade
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                            <a
                              href={`tel:${lead.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-emerald-600 font-mono"
                            >
                              {lead.mobile}
                            </a>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </span>
                          </div>
                          {lead.email && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {lead.email}
                            </p>
                          )}
                        </div>

                        {/* Fleet Tier & Space Status */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              lead.preferredPackage === "platinum"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : lead.preferredPackage === "gold"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {lead.preferredPackage} Partner
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {lead.spaceStatus || "Office Ready"}
                          </span>
                        </div>

                        {/* Bottom Actions */}
                        <div
                          className="flex items-center justify-between pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            {lead.credentials && (
                              <a
                                href={`${portalUrl}/vendor/login?appId=${encodeURIComponent((lead.credentials as any).userId)}&pass=${encodeURIComponent((lead.credentials as any).password)}&auto=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100"
                                title="Open Vendor Dashboard with 1-click auto-login"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Portal</span>
                              </a>
                            )}
                            <a
                              href={`tel:${lead.mobile}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                            <a
                              href={whatsApp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-xs font-semibold hover:bg-[#25D366]/20"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/activity?query=${encodeURIComponent(lead.mobile || lead.fullName)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                              title="View Previous Activity for this vendor"
                            >
                              <History className="w-3.5 h-3.5 text-emerald-600" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentModal(lead);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
                              title="Record dynamic manual payment"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pay</span>
                            </button>

                            <Link
                              href={`/vendor/manage/${lead.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">
                    {loading ? "Loading vendor leads..." : "No vendor leads match your criteria."}
                  </div>
                )}
              </div>

              {/* Leads Table */}
              <div className="hidden md:block rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Application</th>
                        <th className="py-3 px-4">Vendor &amp; Contact</th>
                        <th className="py-3 px-4">Base City</th>
                        <th className="py-3 px-4">Fleet Tier &amp; Model</th>
                        <th className="py-3 px-4">Onboarding Status</th>
                        <th className="py-3 px-4 text-right">Quick Contact</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.length > 0 ? (
                        leads.map((lead) => {
                          const whatsApp = getWhatsAppLink(
                            lead.mobile,
                            lead.fullName,
                            lead.applicationId,
                            "Vendor"
                          );
                          const hasPendingTicket =
                            (lead.pendingTicketCount && lead.pendingTicketCount > 0) || false;
                          const hasCredentials = !!lead.credentials?.userId;

                          return (
                            <tr
                              key={lead.id}
                              className="hover:bg-slate-50 transition-colors group cursor-pointer"
                              onClick={() => {
                                router.push(`/vendor/manage/${lead.id}`);
                              }}
                            >
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-emerald-600">
                                  {lead.applicationId}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {formatDate(lead.createdAt)}
                                </p>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 text-xs">{lead.fullName}</p>
                                  {hasPendingTicket && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                      title="Vendor requested a plan upgrade!"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Upgrade
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600">{lead.mobile}</p>
                                {lead.email && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                    {lead.email}
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-800">{lead.city}</p>
                                <p className="text-[11px] text-slate-500">
                                  {lead.state || "—"}
                                </p>
                              </td>

                              <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={lead.preferredPackage || "silver"}
                                  onChange={(e) =>
                                    handleUpdateTier(lead.id, e.target.value)
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-white focus:outline-none cursor-pointer ${
                                    lead.preferredPackage === "platinum"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : lead.preferredPackage === "gold"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <option value="silver">Silver Partner</option>
                                  <option value="gold">Gold Partner</option>
                                  <option value="platinum">Platinum Partner</option>
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {lead.spaceStatus || "Office Ready"}
                                </p>
                              </td>

                              <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={lead.status}
                                  onChange={(e) =>
                                    handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                                  }
                                  className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border bg-white focus:outline-none cursor-pointer ${
                                    lead.status === "approved"
                                      ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                      : lead.status === "in_progress" || lead.status === "payment_completed"
                                      ? "text-purple-700 border-purple-200 bg-purple-50"
                                      : lead.status === "pending"
                                      ? "text-amber-700 border-amber-200 bg-amber-50"
                                      : lead.status === "rejected"
                                      ? "text-rose-700 border-rose-200 bg-rose-50"
                                      : "text-blue-700 border-blue-200 bg-blue-50"
                                  }`}
                                >
                                  <option value="new">1. New</option>
                                  <option value="pending">2. Pending</option>
                                  <option value="in_progress">3. In Progress</option>
                                  <option value="approved">4. Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>

                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  {lead.credentials && (
                                    <a
                                      href={`${portalUrl}/vendor/login?appId=${encodeURIComponent((lead.credentials as any).userId)}&pass=${encodeURIComponent((lead.credentials as any).password)}&auto=1`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
                                      title="Open Vendor Dashboard with 1-click auto-login"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <a
                                    href={`tel:${lead.mobile}`}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                                    title={`Call ${lead.mobile}`}
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={whatsApp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={`/activity?query=${encodeURIComponent(lead.mobile || lead.fullName)}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
                                    title="View Previous Activity for this vendor"
                                  >
                                    <History className="w-3 h-3 text-emerald-600" />
                                    <span>Activity</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(lead)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] transition-all border border-amber-200/60 cursor-pointer"
                                    title="Record dynamic manual payment"
                                  >
                                    <CreditCard className="w-3 h-3 text-amber-600" />
                                    <span>Pay</span>
                                  </button>
                                  <Link
                                    href={`/vendor/manage/${lead.id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition-all border border-emerald-200/60"
                                  >
                                    <span>Manage</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            {loading ? "Loading vendor leads..." : "No vendor leads match your criteria."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ======================= TAB 2: PLAN UPGRADE TICKETS ======================= */}
          {activeTab === "tickets" && (
            <>
              {/* Tickets KPI Cards (1-Step Verification Lifecycle) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Requests
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{ticketCounts.total || tickets.length}</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Verification</span>
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1 flex items-center gap-2">
                    <span>
                      {(ticketCounts.pending || 0) +
                        (ticketCounts.paymentCompleted || 0) +
                        (ticketCounts.awaitingPayment || 0)}
                    </span>
                    {(ticketCounts.paymentCompleted || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        {ticketCounts.paymentCompleted} Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-emerald-200 bg-emerald-50/50 shadow-sm">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Upgraded</span>
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                    {ticketCounts.approved}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Rejected Requests</span>
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-700 mt-1">
                    {ticketCounts.rejected}
                  </div>
                </div>
              </div>

              {/* Tickets Search & Filter */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 sm:gap-4 shadow-sm">
                <div className="w-full sm:flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID, vendor name, mobile, or application ID..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 text-xs">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="all">All Ticket Statuses</option>
                    <option value="pending_all">Pending Verification &amp; Issue Login</option>
                    <option value="APPROVED">Completed &amp; Upgraded</option>
                    <option value="REJECTED">Rejected Requests</option>
                  </select>
                </div>
              </div>

              {/* ========================================================= */}
              {/* MOBILE VIEW: TICKETS CARD LIST (Visible on < md) */}
              {/* ========================================================= */}
              <div className="md:hidden space-y-3">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((t) => {
                    const statusUpper = (t.status || "").toUpperCase();
                    const isPending = statusUpper === "PENDING";
                    const isPaymentCompleted = statusUpper === "PAYMENT_COMPLETED";
                    const isApproved = statusUpper === "APPROVED" || statusUpper === "COMPLETED";
                    const isRejected = statusUpper === "REJECTED";

                    const fee = t.totalAmount
                      ? {
                          upgradeAmount: t.upgradeAmount || 0,
                          gatewayFee: t.gatewayFee || 0,
                          gstAmount: t.gstAmount || 0,
                          totalAmount: t.totalAmount,
                        }
                      : calculateUpgradeFees(t.currentPlan, t.requestedPlan);

                    return (
                      <div
                        key={t.id || t.ticketId}
                        className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
                          isPending
                            ? "bg-white border-amber-300"
                            : isPaymentCompleted
                            ? "bg-white border-emerald-300 shadow-emerald-500/5"
                            : isApproved
                            ? "bg-white border-emerald-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {/* Top: Ticket ID, Date & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              #{t.ticketId}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDate(t.createdAt)}
                            </span>
                          </div>

                          <div>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Upgraded</span>
                              </span>
                            ) : isPaymentCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Paid: Ready</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Vendor Name & Application */}
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.vendorName}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                            <a href={`tel:${t.vendorMobile}`} className="hover:text-emerald-600 font-mono">
                              {t.vendorMobile}
                            </a>
                            <span>•</span>
                            <span className="font-mono text-emerald-700 text-[11px] font-semibold">
                              {t.applicationId}
                            </span>
                          </div>
                        </div>

                        {/* Plan Transition & Fee */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-medium">Plan Upgrade</span>
                            <div className="flex items-center gap-1.5 font-bold mt-0.5">
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] uppercase">
                                {t.currentPlan}
                              </span>
                              <ArrowRight className="w-3 h-3 text-amber-500" />
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] uppercase font-bold">
                                {t.requestedPlan}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              ₹{fee.totalAmount.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                t.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {t.paymentStatus || "UNPAID"}
                            </span>
                          </div>
                        </div>

                        {t.reason && (
                          <p className="text-slate-600 italic text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            &ldquo;{t.reason}&rdquo;
                          </p>
                        )}

                        {/* Upgraded Login details if generated */}
                        {isApproved && t.newUserId && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 text-[10px]">User ID:</span>
                              <span className="text-emerald-700 font-bold">{t.newUserId}</span>
                            </div>
                            {t.newPassword && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-[10px]">Password:</span>
                                <span className="text-slate-900 font-bold">{t.newPassword}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                          {!isApproved && !isRejected ? (
                            <div className="flex items-center gap-2 w-full">
                              <button
                                onClick={() =>
                                  setActionTicket({ ticket: t, type: "approve_and_issue" })
                                }
                                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Approve &amp; Issue Login</span>
                              </button>
                              <button
                                onClick={() =>
                                  setActionTicket({ ticket: t, type: "reject" })
                                }
                                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              {isApproved && t.newUserId && t.newPassword ? (
                                <a
                                  href={getUpgradeCredentialsWhatsAppLink(
                                    t.vendorMobile,
                                    t.vendorName,
                                    t.applicationId,
                                    t.requestedPlan,
                                    t.newUserId,
                                    t.newPassword
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-sm transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send via WhatsApp</span>
                                </a>
                              ) : <div />}

                              <button
                                onClick={() => {
                                  const matchedLead = leads.find(
                                    (l) => l.applicationId === t.applicationId
                                  );
                                  if (matchedLead) {
                                    setSelectedLead(matchedLead);
                                    setIsDetailOpen(true);
                                  } else {
                                    alert(`Vendor profile for ${t.applicationId} not found.`);
                                  }
                                }}
                                className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer text-xs flex items-center gap-1 font-medium"
                              >
                                <span>Profile</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">
                    {loadingTickets ? "Loading upgrade tickets..." : "No upgrade tickets found."}
                  </div>
                )}
              </div>

              {/* Tickets Table */}
              <div className="hidden md:block rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Vendor &amp; Contact</th>
                        <th className="py-3 px-4">Plan Transition</th>
                        <th className="py-3 px-4">Upgrade Fee &amp; Payment</th>
                        <th className="py-3 px-4">Verification &amp; Payment Status</th>
                        <th className="py-3 px-4">Upgraded Login Info</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTickets.length > 0 ? (
                        filteredTickets.map((t) => {
                          const statusUpper = (t.status || "").toUpperCase();
                          const isPending = statusUpper === "PENDING";
                          const isAwaitingPay = statusUpper === "AWAITING_PAYMENT";
                          const isPaymentCompleted = statusUpper === "PAYMENT_COMPLETED";
                          const isApproved = statusUpper === "APPROVED" || statusUpper === "COMPLETED";
                          const isRejected = statusUpper === "REJECTED";

                          const fee = t.totalAmount
                            ? {
                                upgradeAmount: t.upgradeAmount || 0,
                                gatewayFee: t.gatewayFee || 0,
                                gstAmount: t.gstAmount || 0,
                                totalAmount: t.totalAmount,
                              }
                            : calculateUpgradeFees(t.currentPlan, t.requestedPlan);

                          return (
                            <tr key={t.id || t.ticketId} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  #{t.ticketId}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {formatDate(t.createdAt)}
                                </p>
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-900 text-xs">{t.vendorName}</p>
                                <p className="text-slate-600">{t.vendorMobile}</p>
                                <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                                  {t.applicationId}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] uppercase">
                                    {t.currentPlan}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] uppercase font-bold">
                                    {t.requestedPlan}
                                  </span>
                                </div>
                                {t.reason && (
                                  <p className="italic text-[10px] text-slate-500 truncate max-w-[170px] mt-1" title={t.reason}>
                                    &ldquo;{t.reason}&rdquo;
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-slate-900 text-xs">
                                  ₹{fee.totalAmount.toLocaleString("en-IN")}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                      t.paymentStatus === "PAID"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {t.paymentStatus || "UNPAID"}
                                  </span>
                                  {t.paymentId && (
                                    <span className="text-[9px] text-slate-500 font-mono truncate max-w-[90px]" title={t.paymentId}>
                                      {t.paymentId}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Upgraded &amp; Active</span>
                                  </span>
                                ) : isPaymentCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse shadow-sm">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    <span>Paid: Ready to Issue Login</span>
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending Verification</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {isApproved && t.newUserId ? (
                                  <div className="font-mono text-[11px]">
                                    <div className="text-emerald-700 font-bold">{t.newUserId}</div>
                                    <div className="text-slate-600 text-[10px]">
                                      Pwd: {t.newPassword}
                                    </div>
                                  </div>
                                ) : isPaymentCompleted ? (
                                  <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                                    Ready to generate
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* 1-Step Approval Action */}
                                  {!isApproved && !isRejected && (
                                    <>
                                      <button
                                        onClick={() =>
                                          setActionTicket({ ticket: t, type: "approve_and_issue" })
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[11px] shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                                        title="Confirm payment and issue upgraded credentials in 1 step"
                                      >
                                        <Key className="w-3.5 h-3.5" />
                                        <span>Approve &amp; Issue Login</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActionTicket({ ticket: t, type: "reject" })
                                        }
                                        className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-all cursor-pointer"
                                        title="Reject request"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {/* Approved WhatsApp dispatch */}
                                  {isApproved && t.newUserId && t.newPassword && (
                                    <a
                                      href={getUpgradeCredentialsWhatsAppLink(
                                        t.vendorMobile,
                                        t.vendorName,
                                        t.applicationId,
                                        t.requestedPlan,
                                        t.newUserId,
                                        t.newPassword
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-[11px] shadow-sm transition-all"
                                      title="Send upgraded login via WhatsApp"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}

                                  {/* Quick open lead detail page */}
                                  <Link
                                    href={`/vendor/manage/${leads.find((l) => l.applicationId === t.applicationId)?.id || t.applicationId}`}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Manage vendor profile on separate page"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            {loadingTickets
                              ? "Loading upgrade tickets..."
                              : "No upgrade tickets found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Main Vendor Lead Detail Modal */}
      <VendorDetailModal
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDelete}
        onRefresh={handleRefreshAll}
      />

      {/* Add New Lead Modal */}
      <AddVendorLeadModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => handleRefreshAll()}
      />

      {/* 2-Step Ticket Action Confirmation Modal */}
      {actionTicket && (() => {
        const t = actionTicket.ticket;
        const feeCalc = calculateUpgradeFees(t.currentPlan, t.requestedPlan);
        const totalPayable = t.totalAmount || feeCalc.totalAmount;
        const reqTierUpper = (t.requestedPlan || "gold").toUpperCase();
        const suffix = (t.ticketId.slice(-4) || t.applicationId.slice(-4) || "1000");
        const previewUserId = `BB-${reqTierUpper}-${suffix}`;
        const previewPassword = `BroomBoom@${reqTierUpper}2026`;

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {actionTicket.type === "reject" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>Reject Plan Change Ticket</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>1-Step Approval: Verify Payment &amp; Issue Upgraded Login</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setActionTicket(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Common Ticket Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="text-slate-500">
                  Ticket: <span className="text-slate-900 font-mono font-bold">#{t.ticketId}</span>
                </div>
                <div className="text-slate-500">
                  Vendor: <span className="text-slate-900 font-bold">{t.vendorName}</span> ({t.vendorMobile})
                </div>
                <div className="text-slate-500">
                  Application: <span className="text-emerald-700 font-mono font-bold">{t.applicationId}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-semibold">
                  <span className="text-slate-500">Plan Change:</span>
                  <span className="text-slate-700 font-bold uppercase">{t.currentPlan}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-emerald-700 font-bold uppercase">{t.requestedPlan}</span>
                </div>
                {t.reason && (
                  <div className="pt-1 text-slate-600 italic text-[11px]">
                    Reason: &ldquo;{t.reason}&rdquo;
                  </div>
                )}
              </div>

              {/* 1-Step Approval: Fee & Credentials Preview */}
              {actionTicket.type !== "reject" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>New Plan Value:</span>
                      <span className="text-slate-900 font-semibold">₹{feeCalc.upgradeAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Gateway Fee (3%) + GST (5%):</span>
                      <span className="text-slate-900">₹{(feeCalc.gatewayFee + feeCalc.gstAmount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700 text-sm">
                      <span>Total Upgrade Fee:</span>
                      <span>₹{totalPayable.toLocaleString("en-IN")} {t.paymentStatus === "PAID" ? "(PAID)" : ""}</span>
                    </div>
                    {t.paymentId && (
                      <div className="flex justify-between text-slate-500 pt-1">
                        <span>Payment Ref:</span>
                        <span className="text-slate-900 font-mono">{t.paymentId}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                    <span className="text-emerald-800 font-bold block text-[11px] uppercase tracking-wider">
                      Upgraded Credentials To Be Issued:
                    </span>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600">User ID:</span>
                      <span className="text-emerald-800 font-bold">{previewUserId}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600">Password:</span>
                      <span className="text-slate-900 font-bold">{previewPassword}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionPaymentConfirmed}
                      onChange={(e) => setActionPaymentConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-900">
                      <strong>Payment &amp; Ticket Verified:</strong> I verify the upgrade request and payment of ₹{totalPayable.toLocaleString("en-IN")}. Authorize immediate upgrade and credential activation.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-600 block mb-1">
                  Admin Remarks (Optional):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g., Fleet verification completed, territory exclusivity updated..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setActionTicket(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessTicketAction}
                  disabled={
                    processingTicket ||
                    ((actionTicket.type === "approve_and_issue" || actionTicket.type === "step2_issue_creds") &&
                      !actionPaymentConfirmed)
                  }
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                    actionTicket.type === "approve_and_issue" || actionTicket.type === "step2_issue_creds"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 disabled:opacity-50"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {processingTicket
                    ? "Processing..."
                    : actionTicket.type === "approve_and_issue" || actionTicket.type === "step2_issue_creds"
                    ? "Confirm & Issue Login Credentials"
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upgraded Credentials Generated Success Modal */}
      {approvedCredsModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-emerald-300 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Plan Upgrade Approved &amp; Credentials Ready!</span>
              </div>
              <button
                onClick={() => setApprovedCredsModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vendor <strong className="text-slate-900">{approvedCredsModal.ticket.vendorName}</strong> has been upgraded to{" "}
              <strong className="text-emerald-700 uppercase">{approvedCredsModal.ticket.requestedPlan} Partner</strong>. New login credentials have been generated:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">User ID:</span>
                <span className="font-bold text-emerald-700">{approvedCredsModal.userId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Password:</span>
                <span className="font-bold text-slate-900">{approvedCredsModal.password}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`http://localhost:3001/vendor/login?appId=${encodeURIComponent(
                  approvedCredsModal.userId
                )}&pass=${encodeURIComponent(approvedCredsModal.password)}&auto=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Upgraded Vendor Dashboard</span>
              </a>

              <a
                href={getUpgradeCredentialsWhatsAppLink(
                  approvedCredsModal.ticket.vendorMobile,
                  approvedCredsModal.ticket.vendorName,
                  approvedCredsModal.ticket.applicationId,
                  approvedCredsModal.ticket.requestedPlan,
                  approvedCredsModal.userId,
                  approvedCredsModal.password
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Upgraded Login via WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  const text = `BroomBoom Upgraded Vendor Login\nPlan: ${approvedCredsModal.ticket.requestedPlan.toUpperCase()}\nUser ID: ${approvedCredsModal.userId}\nPassword: ${approvedCredsModal.password}\nLogin URL: http://localhost:3001/vendor/login`;
                  navigator.clipboard.writeText(text);
                  setCopiedSuccessCred(true);
                  setTimeout(() => setCopiedSuccessCred(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all"
              >
                {copiedSuccessCred ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSuccessCred ? "Copied to Clipboard!" : "Copy Upgraded Credentials"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Manual Payment Modal for Leads Table */}
      {paymentLead && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Dynamic Manual Payment</h3>
                  <p className="text-[11px] text-slate-500">Offline / Direct Bank / Cash / UPI Payment Entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentLead(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Vendor Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-slate-900">{paymentLead.fullName} ({paymentLead.mobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application ID:</span>
                <span className="font-mono font-bold text-emerald-700">{paymentLead.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Plan:</span>
                <span className="font-bold text-slate-800 uppercase">{paymentLead.preferredPackage} Partner</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold uppercase text-amber-700">{paymentLead.status}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={leadPaymentForm.amount}
                  onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 21600"
                />
                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {[
                    { label: "Silver (₹10,800)", val: "10800" },
                    { label: "Gold (₹21,600)", val: "21600" },
                    { label: "Platinum (₹54,000)", val: "54000" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setLeadPaymentForm({ ...leadPaymentForm, amount: p.val })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={leadPaymentForm.paymentMode}
                    onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash (HQ / Field Office)</option>
                    <option value="Bank Transfer (NEFT/RTGS/IMPS)">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI / QR Code">UPI / QR Code (PhonePe / GPay / Paytm)</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Reference / UTR / Receipt No.
                  </label>
                  <input
                    type="text"
                    value={leadPaymentForm.paymentReference}
                    onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, paymentReference: e.target.value })}
                    placeholder="e.g. UTR-HDFC-9912 or UPI/629088"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={leadPaymentForm.paymentDate}
                  onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Admin Remarks / Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={leadPaymentForm.notes}
                  onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, notes: e.target.value })}
                  placeholder="e.g. Direct bank deposit confirmed in BroomBoom operations account."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadPaymentForm.setApproved}
                    onChange={(e) => setLeadPaymentForm({ ...leadPaymentForm, setApproved: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Approve &amp; Generate Login Password Immediately
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      If checked, status becomes <strong>APPROVED</strong>, license is activated, and portal login credentials are created immediately.
                      If unchecked, status becomes <strong>IN PROGRESS</strong> (Paid) awaiting final inspection.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingPayment}
                onClick={handleRecordLeadPayment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {submittingPayment ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Record Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Credentials Success Modal */}
      {paymentSuccessCreds && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Payment Recorded &amp; Login Ready!</span>
              </div>
              <button
                onClick={() => setPaymentSuccessCreds(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vendor <strong className="text-slate-900">{paymentSuccessCreds.lead.fullName}</strong> is now{" "}
              <strong className="text-emerald-700 uppercase">Approved &amp; Active</strong>. Portal login credentials have been generated:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">User ID:</span>
                <span className="font-bold text-emerald-700">{paymentSuccessCreds.userId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[11px]">Password:</span>
                <span className="font-bold text-slate-900">{paymentSuccessCreds.password}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`${portalUrl}/vendor/login?appId=${encodeURIComponent(
                  paymentSuccessCreds.userId
                )}&pass=${encodeURIComponent(paymentSuccessCreds.password)}&auto=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Vendor Dashboard</span>
              </a>

              <a
                href={getCredentialsWhatsAppLink(
                  paymentSuccessCreds.lead.mobile,
                  paymentSuccessCreds.lead.fullName,
                  paymentSuccessCreds.lead.applicationId,
                  paymentSuccessCreds.lead.preferredPackage || "gold",
                  paymentSuccessCreds.userId,
                  paymentSuccessCreds.password
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Credentials via WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  const text = `BroomBoom Vendor Login Credentials\nUser ID: ${paymentSuccessCreds.userId}\nPassword: ${paymentSuccessCreds.password}\nLogin URL: ${portalUrl}/vendor/login`;
                  navigator.clipboard.writeText(text);
                  setCopiedPaySuccessCred(true);
                  setTimeout(() => setCopiedPaySuccessCred(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all cursor-pointer"
              >
                {copiedPaySuccessCred ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedPaySuccessCred ? "Copied to Clipboard!" : "Copy Credentials"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
