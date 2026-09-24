"use client";

import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"leads" | "tickets">("leads");

  // Leads State
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [subCount, setSubCount] = useState(0);
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

  const handleRefreshAll = () => {
    fetchLeads();
    fetchTickets();
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
  const newCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
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
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar
        vendorCount={totalCount}
        vendorSubCount={subCount}
        pendingTicketCount={pendingTicketCount}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor & Fleet Management"
          subtitle="Vendor Onboarding, Portal Access & Plan Upgrade Tickets"
          onRefresh={handleRefreshAll}
          isRefreshing={refreshing || loadingTickets}
        />

        <div className="p-8 space-y-6 overflow-y-auto">
          {/* TOP TABS: Leads Desk vs Plan Upgrade Tickets */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "leads"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Vendor Leads Desk</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === "leads"
                    ? "bg-slate-950 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "tickets"
                  ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
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
                      : "bg-slate-800 text-slate-400"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Total Vendors
                  </span>
                  <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase">
                    Pending Verification
                  </span>
                  <div className="text-2xl font-bold text-blue-400 mt-1">{newCount}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase">
                    Under Inspection
                  </span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{contactedCount}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                    Active Fleet Attached
                  </span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
                </div>
              </div>

              {/* Filter / Search Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by vendor name, mobile, city, or application ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </form>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-400 font-medium"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="review">Inspection</option>
                    <option value="approved">Active / Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-400 font-medium"
                  >
                    <option value="all">All Fleet Tiers</option>
                    <option value="silver">Silver Partner (1-3 Cabs)</option>
                    <option value="gold">Gold Partner (District Hub - 4-10 Cabs)</option>
                    <option value="platinum">Platinum Partner (Regional - 10+ Cabs)</option>
                  </select>

                  <a
                    href="/api/export?type=vendor"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </a>

                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vendor Lead</span>
                  </button>
                </div>
              </div>

              {/* Leads Table */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Application</th>
                        <th className="py-3 px-4">Vendor &amp; Contact</th>
                        <th className="py-3 px-4">Base City</th>
                        <th className="py-3 px-4">Fleet Tier &amp; Model</th>
                        <th className="py-3 px-4">Onboarding Status</th>
                        <th className="py-3 px-4 text-right">Quick Contact</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
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
                              className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsDetailOpen(true);
                              }}
                            >
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-emerald-400">
                                  {lead.applicationId}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {formatDate(lead.createdAt)}
                                </p>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-xs">{lead.fullName}</p>
                                  {hasPendingTicket && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                      title="Vendor requested a plan upgrade!"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Upgrade
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400">{lead.mobile}</p>
                                {lead.email && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                    {lead.email}
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-200">{lead.city}</p>
                                <p className="text-[11px] text-slate-400">
                                  {lead.state || "—"}
                                </p>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    lead.preferredPackage === "platinum"
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                      : lead.preferredPackage === "gold"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : "bg-slate-700/50 text-slate-300 border border-slate-600"
                                  }`}
                                >
                                  {lead.preferredPackage} Partner
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  {lead.spaceStatus || "Office Ready"}
                                </p>
                              </td>

                              <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={lead.status}
                                  onChange={(e) =>
                                    handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                                  }
                                  className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border bg-slate-950 focus:outline-none cursor-pointer ${
                                    lead.status === "approved"
                                      ? "text-emerald-400 border-emerald-500/40"
                                      : lead.status === "contacted"
                                      ? "text-amber-400 border-amber-500/40"
                                      : lead.status === "review"
                                      ? "text-purple-400 border-purple-500/40"
                                      : lead.status === "rejected"
                                      ? "text-rose-400 border-rose-500/40"
                                      : "text-blue-400 border-blue-500/40"
                                  }`}
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="review">Inspection</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>

                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`tel:${lead.mobile}`}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                                    title={`Call ${lead.mobile}`}
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={whatsApp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-slate-950 transition-all"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setIsDetailOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-400 hover:text-slate-950 text-slate-300 font-semibold text-[11px] transition-all"
                                >
                                  <span>Manage</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Requests
                  </span>
                  <div className="text-2xl font-bold text-white mt-1">{ticketCounts.total || tickets.length}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Verification</span>
                  </span>
                  <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-2">
                    <span>
                      {(ticketCounts.pending || 0) +
                        (ticketCounts.paymentCompleted || 0) +
                        (ticketCounts.awaitingPayment || 0)}
                    </span>
                    {(ticketCounts.paymentCompleted || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                        {ticketCounts.paymentCompleted} Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Upgraded</span>
                  </span>
                  <div className="text-2xl font-bold text-emerald-300 mt-1">
                    {ticketCounts.approved}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rejected Requests</span>
                  </span>
                  <div className="text-2xl font-bold text-slate-400 mt-1">
                    {ticketCounts.rejected}
                  </div>
                </div>
              </div>

              {/* Tickets Search & Filter */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[260px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID, vendor name, mobile, or application ID..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="all">All Ticket Statuses</option>
                    <option value="pending_all">Pending Verification &amp; Issue Login</option>
                    <option value="APPROVED">Completed &amp; Upgraded</option>
                    <option value="REJECTED">Rejected Requests</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Vendor &amp; Contact</th>
                        <th className="py-3 px-4">Plan Transition</th>
                        <th className="py-3 px-4">Upgrade Fee &amp; Payment</th>
                        <th className="py-3 px-4">Verification &amp; Payment Status</th>
                        <th className="py-3 px-4">Upgraded Login Info</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
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
                            <tr key={t.id || t.ticketId} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-white text-xs">
                                  #{t.ticketId}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {formatDate(t.createdAt)}
                                </p>
                              </td>

                              <td className="py-3.5 px-4">
                                <p className="font-bold text-white text-xs">{t.vendorName}</p>
                                <p className="text-slate-400">{t.vendorMobile}</p>
                                <span className="text-[10px] font-mono text-emerald-400">
                                  {t.applicationId}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">
                                    {t.currentPlan}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold">
                                    {t.requestedPlan}
                                  </span>
                                </div>
                                {t.reason && (
                                  <p className="italic text-[10px] text-slate-400 truncate max-w-[170px] mt-1" title={t.reason}>
                                    &ldquo;{t.reason}&rdquo;
                                  </p>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-white text-xs">
                                  ₹{fee.totalAmount.toLocaleString("en-IN")}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                      t.paymentStatus === "PAID"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-slate-800 text-slate-400"
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
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Upgraded &amp; Active</span>
                                  </span>
                                ) : isPaymentCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse shadow-sm shadow-emerald-500/20">
                                    <Sparkles className="w-3 h-3 text-emerald-400" />
                                    <span>Paid: Ready to Issue Login</span>
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending Verification</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {isApproved && t.newUserId ? (
                                  <div className="font-mono text-[11px]">
                                    <div className="text-emerald-400 font-bold">{t.newUserId}</div>
                                    <div className="text-slate-400 text-[10px]">
                                      Pwd: {t.newPassword}
                                    </div>
                                  </div>
                                ) : isPaymentCompleted ? (
                                  <div className="text-[10px] text-emerald-400 font-mono">
                                    Ready to generate
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">—</span>
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
                                        className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition-all cursor-pointer"
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

                                  {/* Quick open lead detail modal */}
                                  <button
                                    onClick={() => {
                                      const matchedLead = leads.find(
                                        (l) => l.applicationId === t.applicationId
                                      );
                                      if (matchedLead) {
                                        setSelectedLead(matchedLead);
                                        setIsDetailOpen(true);
                                      } else {
                                        alert(`Vendor profile for ${t.applicationId} not found in current list.`);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                                    title="View full vendor profile"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {actionTicket.type === "reject" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Reject Plan Change Ticket</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span>1-Step Approval: Verify Payment &amp; Issue Upgraded Login</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setActionTicket(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Common Ticket Details */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="text-slate-400">
                  Ticket: <span className="text-white font-mono font-bold">#{t.ticketId}</span>
                </div>
                <div className="text-slate-400">
                  Vendor: <span className="text-white font-bold">{t.vendorName}</span> ({t.vendorMobile})
                </div>
                <div className="text-slate-400">
                  Application: <span className="text-emerald-400 font-mono">{t.applicationId}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-semibold">
                  <span className="text-slate-400">Plan Change:</span>
                  <span className="text-slate-300 font-bold uppercase">{t.currentPlan}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-emerald-400 font-bold uppercase">{t.requestedPlan}</span>
                </div>
                {t.reason && (
                  <div className="pt-1 text-slate-300 italic text-[11px]">
                    Reason: &ldquo;{t.reason}&rdquo;
                  </div>
                )}
              </div>

              {/* 1-Step Approval: Fee & Credentials Preview */}
              {actionTicket.type !== "reject" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>New Plan Value:</span>
                      <span className="text-white font-semibold">₹{feeCalc.upgradeAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Gateway Fee (3%) + GST (5%):</span>
                      <span className="text-white">₹{(feeCalc.gatewayFee + feeCalc.gstAmount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-emerald-400 text-sm">
                      <span>Total Upgrade Fee:</span>
                      <span>₹{totalPayable.toLocaleString("en-IN")} {t.paymentStatus === "PAID" ? "(PAID)" : ""}</span>
                    </div>
                    {t.paymentId && (
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>Payment Ref:</span>
                        <span className="text-white font-mono">{t.paymentId}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1.5">
                    <span className="text-emerald-400 font-bold block text-[11px] uppercase tracking-wider">
                      Upgraded Credentials To Be Issued:
                    </span>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">User ID:</span>
                      <span className="text-emerald-300 font-bold">{previewUserId}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Password:</span>
                      <span className="text-white font-bold">{previewPassword}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionPaymentConfirmed}
                      onChange={(e) => setActionPaymentConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className="text-emerald-200">
                      <strong>Payment &amp; Ticket Verified:</strong> I verify the upgrade request and payment of ₹{totalPayable.toLocaleString("en-IN")}. Authorize immediate upgrade and credential activation.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Admin Remarks (Optional):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g., Fleet verification completed, territory exclusivity updated..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setActionTicket(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
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
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Plan Upgrade Approved & Credentials Ready!</span>
              </div>
              <button
                onClick={() => setApprovedCredsModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Vendor <strong className="text-white">{approvedCredsModal.ticket.vendorName}</strong> has been upgraded to{" "}
              <strong className="text-emerald-400 uppercase">{approvedCredsModal.ticket.requestedPlan} Partner</strong>. New login credentials have been generated:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">User ID:</span>
                <span className="font-bold text-emerald-400">{approvedCredsModal.userId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Password:</span>
                <span className="font-bold text-white">{approvedCredsModal.password}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all"
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
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
              >
                {copiedSuccessCred ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSuccessCred ? "Copied to Clipboard!" : "Copy Upgraded Credentials"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
