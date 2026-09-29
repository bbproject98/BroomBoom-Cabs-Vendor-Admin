"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  Car,
  MessageCircle,
  FileText,
  Trash2,
  Save,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { VendorLead, LeadStatus, VendorUser, PlanChangeTicket } from "@/types";
import {
  formatDate,
  getWhatsAppLink,
  getCredentialsWhatsAppLink,
  getUpgradeCredentialsWhatsAppLink,
  calculateUpgradeFees,
} from "@/lib/utils";

interface VendorDetailModalProps {
  lead: VendorLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
  onRefresh,
}) => {
  if (!isOpen || !lead) return null;

  const [notes, setNotes] = useState(lead.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Credentials State
  const [credentials, setCredentials] = useState<VendorUser | null>(
    (lead.credentials as VendorUser) || null
  );
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [generatingCreds, setGeneratingCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<PlanChangeTicket[]>(lead.tickets || []);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketActionModal, setTicketActionModal] = useState<{
    ticket: PlanChangeTicket;
    type: "approve_and_issue" | "step1_approve" | "step2_issue_creds" | "mark_paid" | "reject";
  } | null>(null);
  const [ticketAdminNotes, setTicketAdminNotes] = useState("");
  const [ticketPaymentRef, setTicketPaymentRef] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Fetch live credentials & tickets when modal opens
  useEffect(() => {
    if (lead) {
      setNotes(lead.adminNotes || "");
      // Immediately reset tickets and credentials to prevent previous vendor's data from flashing
      setTickets([]);
      setCredentials((lead.credentials as VendorUser) || null);
      fetchCredentials();
      fetchTickets();
    }
  }, [lead?.id, lead?.applicationId]);

  const fetchCredentials = async () => {
    if (!lead) return;
    try {
      setLoadingCreds(true);
      const res = await fetch(
        `/api/vendor/credentials?applicationId=${encodeURIComponent(
          lead.applicationId
        )}&mobile=${encodeURIComponent(lead.mobile)}`
      );
      const data = await res.json();
      if (data.success && data.user) {
        setCredentials(data.user);
      } else {
        setCredentials(null);
      }
    } catch (e) {
      console.error("Failed to load vendor credentials:", e);
    } finally {
      setLoadingCreds(false);
    }
  };

  const fetchTickets = async () => {
    if (!lead) return;
    try {
      setLoadingTickets(true);
      const res = await fetch(
        `/api/vendor/tickets?applicationId=${encodeURIComponent(lead.applicationId)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error("Failed to load vendor tickets:", e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleGenerateCredentials = async (isReset = false) => {
    if (!lead) return;
    try {
      setGeneratingCreds(true);
      const res = await fetch("/api/vendor/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: lead.applicationId,
          mobile: lead.mobile,
          vendorName: lead.fullName,
          email: lead.email,
          planTier: lead.preferredPackage || "silver",
          plan: lead.preferredPackage || "silver",
          reset: isReset,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCredentials(data.user);
        alert(
          isReset
            ? "Login credentials have been regenerated successfully!"
            : "Login credentials created successfully! You can now send them to the vendor via WhatsApp."
        );
      } else {
        alert(data.error || "Failed to generate credentials.");
      }
    } catch (e) {
      console.error("Error generating credentials:", e);
      alert("Failed to generate credentials.");
    } finally {
      setGeneratingCreds(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onUpdateNotes(lead.id, notes);
    setSavingNotes(false);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatusLoading(true);
    await onUpdateStatus(lead.id, newStatus);
    if (newStatus === "approved") {
      await fetchCredentials();
      if (onRefresh) onRefresh();
    }
    setStatusLoading(false);
  };

  const handleProcessTicket = async () => {
    if (!ticketActionModal) return;
    const { ticket, type } = ticketActionModal;

    if ((type === "approve_and_issue" || type === "step2_issue_creds") && !paymentConfirmed) {
      alert("Please confirm the verification checkbox before issuing credentials.");
      return;
    }

    try {
      setSubmittingTicket(true);
      const res = await fetch("/api/vendor/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          action: type,
          adminNotes: ticketAdminNotes,
          paymentId: ticketPaymentRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Ticket #${ticket.ticketId} processed successfully.`);
        setTicketActionModal(null);
        setTicketAdminNotes("");
        setTicketPaymentRef("");
        setPaymentConfirmed(false);
        // Refresh local data & parent
        await fetchTickets();
        await fetchCredentials();
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Failed to process ticket.");
      }
    } catch (e) {
      console.error("Error processing ticket:", e);
      alert("Failed to process ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const whatsAppGeneralUrl = getWhatsAppLink(
    lead.mobile,
    lead.fullName,
    lead.applicationId,
    "Vendor"
  );

  const pendingTickets = tickets.filter((t) => t.status === "PENDING");
  const completedTickets = tickets.filter((t) => t.status !== "PENDING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-none">{lead.fullName}</h3>
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                  {lead.applicationId}
                </span>
                {pendingTickets.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    ⚡ Upgrade
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Registered on {formatDate(lead.createdAt)} via {lead.source || "Vendor Portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Quick Contact Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <a
              href={`tel:${lead.mobile}`}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-md transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {lead.mobile}</span>
            </a>

            <a
              href={whatsAppGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold text-xs shadow-md transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Onboarding & Approval Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Vendor Application & License Status
              </label>
              {lead.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {(
                [
                  { id: "new", label: "New", color: "hover:border-blue-500 hover:bg-blue-500/10", active: "bg-blue-500/20 border-blue-500 text-blue-400 font-bold" },
                  { id: "contacted", label: "Contacted", color: "hover:border-amber-500 hover:bg-amber-500/10", active: "bg-amber-500/20 border-amber-500 text-amber-400 font-bold" },
                  { id: "review", label: "Inspection", color: "hover:border-purple-500 hover:bg-purple-500/10", active: "bg-purple-500/20 border-purple-500 text-purple-400 font-bold" },
                  { id: "approved", label: "Approved / Active", color: "hover:border-emerald-500 hover:bg-emerald-500/10", active: "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold" },
                  { id: "rejected", label: "Rejected", color: "hover:border-rose-500 hover:bg-rose-500/10", active: "bg-rose-500/20 border-rose-500 text-rose-400 font-bold" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  disabled={statusLoading}
                  onClick={() => handleStatusChange(s.id)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all ${
                    lead.status === s.id
                      ? s.active
                      : `border-slate-800 bg-slate-800/30 text-slate-400 ${s.color}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* VENDOR PORTAL LOGIN CREDENTIALS DESK */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Vendor Portal Login Credentials
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Vendor uses these credentials to log in at{" "}
                    <code className="text-emerald-400 font-mono">/vendor/login</code>
                  </p>
                </div>
              </div>

              {credentials ? (
                <button
                  onClick={() => handleGenerateCredentials(true)}
                  disabled={generatingCreds}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/70 border border-slate-700 transition-all"
                  title="Generate new password"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingCreds ? "animate-spin" : ""}`} />
                  <span>Reset Password</span>
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateCredentials(false)}
                  disabled={generatingCreds}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-950 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingCreds ? "Creating..." : "Generate Login"}</span>
                </button>
              )}
            </div>

            {loadingCreds ? (
              <div className="py-4 text-center text-xs text-slate-500">Checking credentials...</div>
            ) : credentials ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* User ID */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        User ID / Username
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {credentials.userId}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(credentials.userId, "userId")}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      title="Copy User ID"
                    >
                      {copiedField === "userId" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        Password
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {showPassword ? credentials.password : "••••••••••••"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials.password, "password")}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Copy Password"
                      >
                        {copiedField === "password" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dispatch Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={getCredentialsWhatsAppLink(
                      lead.mobile,
                      lead.fullName,
                      lead.applicationId,
                      credentials.currentPlan || lead.preferredPackage || "Silver",
                      credentials.userId,
                      credentials.password
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Login Credentials via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      const text = `BroomBoom Vendor Login Details\nApplication: ${lead.applicationId}\nUser ID: ${credentials.userId}\nPassword: ${credentials.password}\nLogin URL: http://localhost:3001/vendor/login`;
                      handleCopy(text, "all");
                    }}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    {copiedField === "all" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === "all" ? "Copied All!" : "Copy Full Details"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  No login credentials generated yet for this vendor.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click <strong className="text-emerald-400">Generate Login</strong> above to assign a User ID and Password.
                </p>
              </div>
            )}
          </div>

          {/* PLAN UPGRADE & SUPPORT TICKETS SECTION */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Plan Upgrade & Change Tickets
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Requests submitted by vendor from their dashboard
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                {tickets.length} total
              </span>
            </div>

            {loadingTickets ? (
              <div className="py-3 text-center text-xs text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                No plan upgrade tickets raised by this vendor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((t) => {
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
                    <div
                      key={t.id || t.ticketId}
                      className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                        isPending
                          ? "bg-amber-500/5 border-amber-500/30"
                          : isAwaitingPay
                          ? "bg-sky-500/5 border-sky-500/30"
                          : isPaymentCompleted
                          ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                          : isApproved
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">
                            #{t.ticketId}
                          </span>
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              Step 1: Pending Review
                            </span>
                          )}
                          {isAwaitingPay && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              Step 1 Approved: Awaiting Pay Now
                            </span>
                          )}
                          {isPaymentCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                              Step 2: Paid! Issue Login
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Upgraded & Active
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Rejected
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>

                      {/* Upgrade Plan Transition & Fee */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] uppercase">
                            {t.currentPlan}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase">
                            {t.requestedPlan}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px]">Fee: </span>
                          <span className="font-mono font-bold text-white">₹{fee.totalAmount.toLocaleString("en-IN")}</span>
                          <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            t.paymentStatus === "PAID"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {t.paymentStatus || "UNPAID"}
                          </span>
                        </div>
                      </div>

                      {t.reason && (
                        <p className="text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 italic text-[11px]">
                          &ldquo;{t.reason}&rdquo;
                        </p>
                      )}

                      {/* If Approved, show generated upgraded credentials */}
                      {isApproved && t.newUserId && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-semibold">
                              Upgraded Credentials Issued:
                            </span>
                            <span className="text-slate-400">
                              {t.approvedAt ? formatDate(t.approvedAt) : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-200">
                            <div>
                              User ID: <span className="text-emerald-300 font-bold">{t.newUserId}</span>
                            </div>
                            {t.newPassword && (
                              <div>
                                Password: <span className="text-white font-bold">{t.newPassword}</span>
                              </div>
                            )}
                          </div>
                          {t.newUserId && t.newPassword && (
                            <div className="pt-1">
                              <a
                                href={getUpgradeCredentialsWhatsAppLink(
                                  lead.mobile,
                                  lead.fullName,
                                  lead.applicationId,
                                  t.requestedPlan,
                                  t.newUserId,
                                  t.newPassword
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-[11px] font-bold shadow-sm transition-all"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send Upgraded Login via WhatsApp</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 1-Step Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {!isApproved && !isRejected && (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() =>
                                setTicketActionModal({ ticket: t, type: "approve_and_issue" })
                              }
                              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Approve &amp; Issue Login</span>
                            </button>
                            <button
                              onClick={() =>
                                setTicketActionModal({ ticket: t, type: "reject" })
                              }
                              className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tier & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 font-medium block">Current Registered Tier</span>
              <p className="text-sm font-bold text-emerald-400 uppercase">
                {lead.packageName || `${lead.preferredPackage} Partner`}
              </p>
              <div className="text-slate-300">
                Budget: <span className="text-white font-medium">{lead.investmentBudget || "Flexible"}</span>
              </div>
              <div className="text-slate-300">
                Finance: <span className="text-white font-medium">{lead.financeRequired || "Self-Funded"}</span>
              </div>
              <div className="text-slate-300">
                Loan Assistance: <span className="text-white font-medium">{lead.loanAssistance || "No"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 font-medium block">Fleet Base & Office</span>
              <p className="text-sm font-bold text-white">
                {lead.city}{lead.state ? `, ${lead.state}` : ""}
              </p>
              {lead.pincode && <div className="text-slate-400">PIN: {lead.pincode}</div>}
              <div className="text-slate-300">
                Office / Space: <span className="text-white font-medium">{lead.spaceStatus || "Not specified"}</span>
              </div>
              <div className="text-slate-300">
                Carpet Area: <span className="text-white font-medium">{lead.carpetArea || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {lead.currentProfession && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Current Business / Fleet Operations:</span>
                <p className="text-slate-200 font-medium">{lead.currentProfession}</p>
              </div>
            )}

            {lead.hasExperience && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Fleet / Taxi Experience:</span>
                <p className="text-slate-200 font-medium">{lead.hasExperience}</p>
              </div>
            )}

            {lead.message && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Vendor Inquiry / Vehicle Breakdown:</span>
                <p className="text-slate-300 italic">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Internal Vendor Operations Notes</span>
              </label>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add fleet inspection remarks, document verification notes, or vehicle list..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Delete vendor record for ${lead.fullName}?`)) {
                onDelete(lead.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Vendor</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* 2-Step Ticket Action Confirmation Modal */}
      {ticketActionModal && (() => {
        const t = ticketActionModal.ticket;
        const feeCalc = calculateUpgradeFees(t.currentPlan, t.requestedPlan);
        const totalPayable = t.totalAmount || feeCalc.totalAmount;
        const reqTierUpper = (t.requestedPlan || "gold").toUpperCase();
        const suffix = (t.ticketId.slice(-4) || t.applicationId.slice(-4) || "1000");
        const previewUserId = `BB-${reqTierUpper}-${suffix}`;
        const previewPassword = `BroomBoom@${reqTierUpper}2026`;

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {ticketActionModal.type === "reject" ? (
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
                  onClick={() => setTicketActionModal(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="text-slate-400">
                  Ticket: <span className="text-white font-mono font-bold">#{t.ticketId}</span>
                </div>
                <div className="text-slate-400">
                  Vendor: <span className="text-white font-bold">{t.vendorName}</span> ({t.vendorMobile})
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
              {ticketActionModal.type !== "reject" && (
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
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
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
                  Admin Notes / Remarks (Optional):
                </label>
                <textarea
                  value={ticketAdminNotes}
                  onChange={(e) => setTicketAdminNotes(e.target.value)}
                  placeholder="e.g., Fleet verification completed, territory exclusivity active..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setTicketActionModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessTicket}
                  disabled={
                    submittingTicket ||
                    ((ticketActionModal.type === "approve_and_issue" || ticketActionModal.type === "step2_issue_creds") &&
                      !paymentConfirmed)
                  }
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                    ticketActionModal.type === "approve_and_issue" || ticketActionModal.type === "step2_issue_creds"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 disabled:opacity-50"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {submittingTicket
                    ? "Processing..."
                    : ticketActionModal.type === "approve_and_issue" || ticketActionModal.type === "step2_issue_creds"
                    ? "Confirm & Issue Login Credentials"
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
