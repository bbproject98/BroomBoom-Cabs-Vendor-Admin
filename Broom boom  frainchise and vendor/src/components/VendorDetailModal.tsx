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
  User,
  MapPin,
  Building,
  Briefcase,
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

  const portalUrl =
    process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || "http://localhost:3001";

  // Core Edit Form State (all fields directly editable)
  const [editForm, setEditForm] = useState({
    fullName: lead.fullName || "",
    mobile: lead.mobile || "",
    alternatePhone: lead.alternatePhone || "",
    email: lead.email || "",
    city: lead.city || "",
    state: lead.state || "",
    pincode: lead.pincode || "",
    proposedAddress: lead.proposedAddress || "",
    spaceStatus: lead.spaceStatus || "",
    carpetArea: lead.carpetArea || "",
    preferredPackage: lead.preferredPackage || "silver",
    packageName: lead.packageName || "",
    investmentBudget: lead.investmentBudget || "",
    financeRequired: lead.financeRequired || "Self-Funded / Ready Capital",
    loanAssistance: lead.loanAssistance || "No (Self-Funded)",
    currentProfession: lead.currentProfession || "",
    hasExperience: lead.hasExperience || "",
    message: lead.message || "",
    source: lead.source || "apply_page",
    status: lead.status || "new",
  });

  const [notes, setNotes] = useState(lead.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Credentials State & Form (editable user id & password)
  const [credentials, setCredentials] = useState<VendorUser | null>(
    (lead.credentials as VendorUser) || null
  );
  const [credForm, setCredForm] = useState({
    userId: "",
    password: "",
  });
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

  // Synchronize lead data when modal opens or lead changes
  useEffect(() => {
    if (lead) {
      setNotes(lead.adminNotes || "");
      setEditForm({
        fullName: lead.fullName || "",
        mobile: lead.mobile || "",
        alternatePhone: lead.alternatePhone || "",
        email: lead.email || "",
        city: lead.city || "",
        state: lead.state || "",
        pincode: lead.pincode || "",
        proposedAddress: lead.proposedAddress || "",
        spaceStatus: lead.spaceStatus || "Owned commercial space ready",
        carpetArea: lead.carpetArea || "800 - 1,200 sq.ft (Ideal for Platinum Master)",
        preferredPackage: lead.preferredPackage || "platinum",
        packageName:
          lead.packageName ||
          (lead.preferredPackage === "platinum"
            ? "Platinum Partner (Regional Master Hub)"
            : lead.preferredPackage === "gold"
            ? "Gold Partner (District Exclusive Hub)"
            : "Silver Partner (Booking Kiosk)"),
        investmentBudget: lead.investmentBudget || "₹50,000 (Platinum Package - 50% OFF Exclusive Deal)",
        financeRequired: lead.financeRequired || "Self-Funded / Ready Capital",
        loanAssistance: lead.loanAssistance || "No (Self-Funded)",
        currentProfession: lead.currentProfession || "Tour & Travels, Taxi Fleet Owner",
        hasExperience: lead.hasExperience || "Yes, currently in travel / taxi / logistics",
        message: lead.message || "",
        source: lead.source || "apply_page",
        status: lead.status || "new",
      });

      const rawCred = (lead.credentials as VendorUser) || null;
      setCredentials(rawCred);
      if (rawCred) {
        setCredForm({
          userId: rawCred.userId || "",
          password: rawCred.password || "",
        });
      } else {
        const rawTier = (lead.preferredPackage || "gold").toUpperCase();
        const suffix = lead.applicationId.replace(/[^0-9]/g, "").slice(-4) || "3764";
        setCredForm({
          userId: `BB-${rawTier}-${suffix}`,
          password: `BroomBoom@${rawTier}2026`,
        });
      }

      setTickets([]);
      fetchCredentials();
      fetchTickets();
    }
  }, [lead?.id, lead?.applicationId]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

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
        setCredForm({
          userId: data.user.userId,
          password: data.user.password,
        });
      } else {
        setCredentials(null);
        // Pre-fill sensible default format for fast creation
        const rawTier = (editForm.preferredPackage || lead.preferredPackage || "gold").toUpperCase();
        const suffix = lead.applicationId.replace(/[^0-9]/g, "").slice(-4) || "3764";
        setCredForm({
          userId: `BB-${rawTier}-${suffix}`,
          password: `BroomBoom@${rawTier}2026`,
        });
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

  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Save specific section
  const handleSaveSection = async (
    sectionName: string,
    sectionData?: Partial<typeof editForm>
  ) => {
    if (!lead) return;
    try {
      setSavingSection(sectionName);
      const payload = {
        ...editForm,
        ...(sectionData || {}),
        adminNotes: notes,
      };

      const res = await fetch(`/api/vendor/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        showNotification(`${sectionName} saved successfully!`);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || `Failed to save ${sectionName}.`);
      }
    } catch (e: any) {
      console.error(`Error saving ${sectionName}:`, e);
      alert(e.message || `Failed to save ${sectionName}.`);
    } finally {
      setSavingSection(null);
    }
  };

  // 1. Save All Lead Details & Custom Credentials
  const handleSaveAllDetails = async () => {
    if (!lead) return;
    try {
      setSavingAll(true);

      // Save lead details
      const res = await fetch(`/api/vendor/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          userId: credForm.userId.trim(),
          password: credForm.password.trim(),
          adminNotes: notes,
        }),
      });
      const data = await res.json();

      if (data.success && data.lead) {
        // Also save credentials explicitly to guarantee DB consistency
        if (credForm.userId.trim() && credForm.password.trim()) {
          try {
            const credRes = await fetch("/api/vendor/credentials", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                applicationId: lead.applicationId,
                userId: credForm.userId.trim(),
                password: credForm.password.trim(),
                planTier: editForm.preferredPackage,
                saveCustom: true,
              }),
            });
            const credData = await credRes.json();
            if (credData.success && credData.user) {
              setCredentials(credData.user);
            }
          } catch (cErr) {
            console.warn("Credential update warn:", cErr);
          }
        }

        showNotification("All vendor details & credentials saved successfully!");
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Failed to save vendor lead details.");
      }
    } catch (e: any) {
      console.error("Error saving vendor details:", e);
      alert(e.message || "Failed to save vendor details.");
    } finally {
      setSavingAll(false);
    }
  };

  // 2. Save Custom Credentials specifically
  const handleSaveCredentials = async () => {
    if (!lead) return;
    if (!credForm.userId.trim() || !credForm.password.trim()) {
      alert("Please provide both User ID and Password.");
      return;
    }

    try {
      setSavingCreds(true);
      const res = await fetch("/api/vendor/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: lead.applicationId,
          userId: credForm.userId.trim(),
          password: credForm.password.trim(),
          planTier: editForm.preferredPackage,
          saveCustom: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCredentials(data.user);
        setCredForm({
          userId: data.user.userId,
          password: data.user.password,
        });
        showNotification("Vendor credentials saved and activated successfully!");
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Failed to save credentials.");
      }
    } catch (e: any) {
      console.error("Error saving credentials:", e);
      alert("Failed to save credentials.");
    } finally {
      setSavingCreds(false);
    }
  };

  // 3. Reset / Auto-Generate Credentials
  const handleGenerateCredentials = async (isReset = false) => {
    if (!lead) return;
    try {
      setGeneratingCreds(true);
      const res = await fetch("/api/vendor/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: lead.applicationId,
          mobile: editForm.mobile || lead.mobile,
          vendorName: editForm.fullName || lead.fullName,
          email: editForm.email || lead.email,
          planTier: editForm.preferredPackage || "silver",
          reset: isReset,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCredentials(data.user);
        setCredForm({
          userId: data.user.userId,
          password: data.user.password,
        });
        showNotification(
          isReset
            ? "Login credentials regenerated successfully!"
            : "Login credentials created & active for Vendor Dashboard!"
        );
        if (onRefresh) onRefresh();
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

  // 4. Change Application Status
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatusLoading(true);
    setEditForm((prev) => ({ ...prev, status: newStatus }));
    await onUpdateStatus(lead.id, newStatus);
    if (newStatus === "approved") {
      await fetchCredentials();
      showNotification("Status set to Approved! Vendor license & dashboard access are active.");
      if (onRefresh) onRefresh();
    } else {
      showNotification(`Status updated to ${newStatus.toUpperCase()}`);
    }
    setStatusLoading(false);
  };

  // 5. Save Notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onUpdateNotes(lead.id, notes);
    setSavingNotes(false);
    showNotification("Internal operations notes saved!");
  };

  // 6. Copy text helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 7. Process Plan Upgrade Tickets
  const handleProcessTicket = async () => {
    if (!ticketActionModal) return;
    const { ticket, type } = ticketActionModal;

    if ((type === "approve_and_issue" || type === "step2_issue_creds") && !paymentConfirmed) {
      alert("Please check the verification confirmation before proceeding.");
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
        showNotification(`Ticket #${ticket.ticketId} approved & upgraded login issued!`);
        setTicketActionModal(null);
        setTicketAdminNotes("");
        setTicketPaymentRef("");
        setPaymentConfirmed(false);
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

  // Dynamic Contact Links based on currently typed inputs
  const currentMobile = editForm.mobile || lead.mobile;
  const currentEmail = editForm.email || lead.email;
  const currentName = editForm.fullName || lead.fullName;
  const whatsAppGeneralUrl = getWhatsAppLink(
    currentMobile,
    currentName,
    lead.applicationId,
    "Vendor"
  );

  const activeUserId = credForm.userId || credentials?.userId || "";
  const activePassword = credForm.password || credentials?.password || "";
  const vendorDashboardUrl = `${portalUrl}/vendor/login?appId=${encodeURIComponent(
    activeUserId
  )}&pass=${encodeURIComponent(activePassword)}&auto=1`;

  const pendingTickets = tickets.filter((t) => t.status === "PENDING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {editForm.fullName || lead.fullName}
                </h3>
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-emerald-700 font-semibold border border-slate-200">
                  {lead.applicationId}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  editForm.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : editForm.status === "review"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : editForm.status === "contacted"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : editForm.status === "rejected"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-blue-100 text-blue-800 border-blue-300"
                }`}>
                  {editForm.status === "approved" ? "Active / Approved" : editForm.status}
                </span>
                {pendingTickets.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    ⚡ Upgrade Request ({pendingTickets.length})
                  </span>
                )}
                {saveSuccessMsg && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Registered on {formatDate(lead.createdAt)} via{" "}
                <span className="font-semibold text-slate-700">{lead.source || "apply_page"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeUserId && activePassword && (
              <a
                href={vendorDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-sm transition-all"
                title="Launch Vendor Dashboard with 1-click automatic authentication"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Dashboard</span>
              </a>
            )}

            <button
              onClick={handleSaveAllDetails}
              disabled={savingAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Save all changes made across all sections"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingAll ? "Saving..." : "Save All Changes"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content - All Sections Directly Editable */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Quick Contact Action Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <a
              href={`tel:${currentMobile}`}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {currentMobile}</span>
            </a>

            <a
              href={whatsAppGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold text-xs shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {currentEmail && (
              <a
                href={`mailto:${currentEmail}`}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* SECTION 1: Applicant & Contact Details (Directly Editable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Applicant &amp; Contact Information</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  handleSaveSection("Contact Details", {
                    fullName: editForm.fullName,
                    mobile: editForm.mobile,
                    alternatePhone: editForm.alternatePhone,
                    email: editForm.email,
                  })
                }
                disabled={savingSection === "Contact Details"}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{savingSection === "Contact Details" ? "Saving..." : "Save Contact"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Applicant Full Name"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Primary Mobile *
                </label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  placeholder="Primary Mobile"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Alternate Phone
                </label>
                <input
                  type="text"
                  value={editForm.alternatePhone}
                  onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                  placeholder="Optional Alternate Phone"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Vendor Application & License Status (Directly Interactive) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Vendor Application &amp; License Status
              </label>
              {editForm.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Active Vendor Partner
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
              {(
                [
                  {
                    id: "new",
                    label: "New",
                    color: "hover:border-blue-400 hover:bg-blue-50",
                    active: "bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-sm",
                  },
                  {
                    id: "contacted",
                    label: "Contacted",
                    color: "hover:border-amber-400 hover:bg-amber-50",
                    active: "bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-sm",
                  },
                  {
                    id: "review",
                    label: "Inspection",
                    color: "hover:border-purple-400 hover:bg-purple-50",
                    active: "bg-purple-50 border-purple-500 text-purple-800 font-bold shadow-sm",
                  },
                  {
                    id: "approved",
                    label: "Approved / Active",
                    color: "hover:border-emerald-400 hover:bg-emerald-50",
                    active: "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm",
                  },
                  {
                    id: "rejected",
                    label: "Rejected",
                    color: "hover:border-rose-400 hover:bg-rose-50",
                    active: "bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-sm",
                  },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={statusLoading}
                  onClick={() => handleStatusChange(s.id)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    editForm.status === s.id
                      ? s.active
                      : `border-slate-200 bg-white text-slate-600 ${s.color}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              * Approving this vendor automatically activates their license in PostgreSQL and ensures login access to the Vendor Dashboard.
            </p>
          </div>

          {/* SECTION 3: VENDOR PORTAL LOGIN CREDENTIALS DESK (Directly Editable & Save) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Vendor Portal Login Credentials
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Vendor uses these credentials to log in at{" "}
                    <code className="text-emerald-700 font-mono font-semibold">/vendor/login</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateCredentials(Boolean(credentials))}
                  disabled={generatingCreds}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  title="Generate or reset default credentials format"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingCreds ? "animate-spin" : ""}`} />
                  <span>{credentials ? "Reset Password" : "Auto-Generate"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={savingCreds}
                  className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Save manual changes to User ID and Password"
                >
                  <Save className="w-3 h-3" />
                  <span>{savingCreds ? "Saving..." : "Save Credentials"}</span>
                </button>
              </div>
            </div>

            {loadingCreds ? (
              <div className="py-4 text-center text-xs text-slate-500">Checking credentials...</div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* Editable Inputs for User ID & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* User ID Input */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500 block uppercase font-mono font-bold">
                        User ID / Username (Editable)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleCopy(credForm.userId, "userId")}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                        title="Copy User ID"
                      >
                        {copiedField === "userId" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={credForm.userId}
                      onChange={(e) => setCredForm({ ...credForm, userId: e.target.value })}
                      placeholder="e.g. BB-GOLD-3764"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-emerald-800 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500 block uppercase font-mono font-bold">
                        Password (Editable)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(credForm.password, "password")}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedField === "password" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credForm.password}
                      onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                      placeholder="e.g. BroomBoom@GOLD2026"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Dispatch & Dashboard Launch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={vendorDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    title="Launch Vendor Dashboard with 1-click auto login"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Vendor Dashboard</span>
                  </a>

                  <a
                    href={getCredentialsWhatsAppLink(
                      currentMobile,
                      currentName,
                      lead.applicationId,
                      editForm.preferredPackage || "Platinum",
                      credForm.userId,
                      credForm.password,
                      portalUrl
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Login via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `BroomBoom Vendor Login Details\nApplication: ${lead.applicationId}\nUser ID: ${credForm.userId}\nPassword: ${credForm.password}\nLogin URL: ${portalUrl}/vendor/login?appId=${encodeURIComponent(credForm.userId)}&pass=${encodeURIComponent(credForm.password)}&auto=1`;
                      handleCopy(text, "all");
                    }}
                    className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                  >
                    {copiedField === "all" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === "all" ? "Copied All!" : "Copy Full Details"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Current Registered Tier & Financial Terms (Directly Editable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Registered Tier &amp; Financial Terms</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  handleSaveSection("Tier & Financials", {
                    preferredPackage: editForm.preferredPackage,
                    packageName: editForm.packageName,
                    investmentBudget: editForm.investmentBudget,
                    financeRequired: editForm.financeRequired,
                    loanAssistance: editForm.loanAssistance,
                  })
                }
                disabled={savingSection === "Tier & Financials"}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{savingSection === "Tier & Financials" ? "Saving..." : "Save Tier & Terms"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Registered Tier *
                </label>
                <select
                  value={editForm.preferredPackage}
                  onChange={(e) => {
                    const tier = e.target.value;
                    const name =
                      tier === "silver"
                        ? "Silver Partner (Booking Kiosk)"
                        : tier === "platinum"
                        ? "Platinum Partner (Regional Master Hub)"
                        : "Gold Partner (District Exclusive Hub)";
                    const defaultBudget =
                      tier === "silver"
                        ? "₹10,000 (Silver Package - 50% OFF Exclusive Deal)"
                        : tier === "platinum"
                        ? "₹50,000 (Platinum Package - 50% OFF Exclusive Deal)"
                        : "₹20,000 (Gold Package - 50% OFF Exclusive Deal)";
                    setEditForm({
                      ...editForm,
                      preferredPackage: tier,
                      packageName: name,
                      investmentBudget: defaultBudget,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="silver">Silver Partner (₹10,000)</option>
                  <option value="gold">Gold Partner (₹20,000)</option>
                  <option value="platinum">Platinum Partner (₹50,000)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Package Display Name
                </label>
                <input
                  type="text"
                  value={editForm.packageName}
                  onChange={(e) => setEditForm({ ...editForm, packageName: e.target.value })}
                  placeholder="e.g. Platinum Partner (Regional Master Hub)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Investment Budget
                </label>
                <input
                  type="text"
                  value={editForm.investmentBudget}
                  onChange={(e) => setEditForm({ ...editForm, investmentBudget: e.target.value })}
                  placeholder="e.g. ₹50,000 (Platinum Package)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Finance Terms / Source
                </label>
                <select
                  value={editForm.financeRequired}
                  onChange={(e) => setEditForm({ ...editForm, financeRequired: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Self-Funded / Ready Capital">Self-Funded / Ready Capital</option>
                  <option value="Bank Loan Required">Bank Loan Required</option>
                  <option value="Partial Finance Required">Partial Finance Required</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Loan Assistance Needed
                </label>
                <select
                  value={editForm.loanAssistance}
                  onChange={(e) => setEditForm({ ...editForm, loanAssistance: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="No (Self-Funded)">No (Self-Funded)</option>
                  <option value="Yes Required">Yes Required</option>
                  <option value="Exploring Options">Exploring Options</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: Fleet Base & Office Location (Directly Editable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fleet Base &amp; Office Location</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  handleSaveSection("Fleet Base & Office", {
                    city: editForm.city,
                    state: editForm.state,
                    pincode: editForm.pincode,
                    spaceStatus: editForm.spaceStatus,
                    carpetArea: editForm.carpetArea,
                    proposedAddress: editForm.proposedAddress,
                  })
                }
                disabled={savingSection === "Fleet Base & Office"}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{savingSection === "Fleet Base & Office" ? "Saving..." : "Save Office Base"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  City / Base *
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="e.g. SINGUR"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="e.g. West Bengal"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  placeholder="e.g. 712124"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Office / Space Status
                </label>
                <input
                  type="text"
                  list="space-options"
                  value={editForm.spaceStatus}
                  onChange={(e) => setEditForm({ ...editForm, spaceStatus: e.target.value })}
                  placeholder="e.g. Owned commercial space ready"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <datalist id="space-options">
                  <option value="Owned commercial space ready" />
                  <option value="Rented commercial space" />
                  <option value="Under renovation / arrangement" />
                  <option value="Home office / Virtual" />
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Carpet Area
                </label>
                <input
                  type="text"
                  list="carpet-options"
                  value={editForm.carpetArea}
                  onChange={(e) => setEditForm({ ...editForm, carpetArea: e.target.value })}
                  placeholder="e.g. 800 - 1,200 sq.ft (Ideal for Platinum Master)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <datalist id="carpet-options">
                  <option value="800 - 1,200 sq.ft (Ideal for Platinum Master)" />
                  <option value="300 - 500 sq.ft (Ideal for Gold Hub)" />
                  <option value="100 - 150 sq.ft (Ideal for Silver Kiosk)" />
                  <option value="650 sq ft" />
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Proposed Office Address
              </label>
              <input
                type="text"
                value={editForm.proposedAddress}
                onChange={(e) => setEditForm({ ...editForm, proposedAddress: e.target.value })}
                placeholder="Full address of proposed fleet operations office"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* SECTION 6: Fleet Operations & Business Background (Directly Editable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fleet Operations &amp; Business Background</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  handleSaveSection("Fleet Background", {
                    currentProfession: editForm.currentProfession,
                    hasExperience: editForm.hasExperience,
                    message: editForm.message,
                    source: editForm.source,
                  })
                }
                disabled={savingSection === "Fleet Background"}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{savingSection === "Fleet Background" ? "Saving..." : "Save Fleet Info"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Current Profession / Fleet Business
                </label>
                <input
                  type="text"
                  value={editForm.currentProfession}
                  onChange={(e) => setEditForm({ ...editForm, currentProfession: e.target.value })}
                  placeholder="e.g. Tour & Travels, Taxi Fleet Owner"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Fleet / Taxi Experience
                </label>
                <input
                  type="text"
                  value={editForm.hasExperience}
                  onChange={(e) => setEditForm({ ...editForm, hasExperience: e.target.value })}
                  placeholder="e.g. Yes, currently in travel / taxi / logistics"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Vendor Inquiry / Vehicle Breakdown Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  placeholder="e.g. 5 Swift Dzire, 3 Ertiga ready for attachment"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Lead Acquisition Source
                </label>
                <input
                  type="text"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  placeholder="e.g. apply_page"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7: Plan Upgrade & Change Tickets */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Plan Upgrade &amp; Change Tickets
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Requests submitted by vendor from their dashboard
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {tickets.length} total
              </span>
            </div>

            {loadingTickets ? (
              <div className="py-3 text-center text-xs text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
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
                          ? "bg-amber-50/50 border-amber-300"
                          : isAwaitingPay
                          ? "bg-sky-50/50 border-sky-300"
                          : isPaymentCompleted
                          ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                          : isApproved
                          ? "bg-emerald-50/30 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            #{t.ticketId}
                          </span>
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              Step 1: Pending Review
                            </span>
                          )}
                          {isAwaitingPay && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                              Step 1 Approved: Awaiting Pay Now
                            </span>
                          )}
                          {isPaymentCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                              Step 2: Paid! Issue Login
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Upgraded &amp; Active
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Rejected
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] uppercase">
                            {t.currentPlan}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase">
                            {t.requestedPlan}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[11px]">Fee: </span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{fee.totalAmount.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {t.paymentStatus || "UNPAID"}
                          </span>
                        </div>
                      </div>

                      {t.reason && (
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 italic text-[11px]">
                          &ldquo;{t.reason}&rdquo;
                        </p>
                      )}

                      {/* If Approved, show generated upgraded credentials */}
                      {isApproved && t.newUserId && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-800 font-semibold">
                              Upgraded Credentials Issued:
                            </span>
                            <span className="text-slate-500">
                              {t.approvedAt ? formatDate(t.approvedAt) : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-800">
                            <div>
                              User ID: <span className="text-emerald-700 font-bold">{t.newUserId}</span>
                            </div>
                            {t.newPassword && (
                              <div>
                                Password: <span className="text-slate-900 font-bold">{t.newPassword}</span>
                              </div>
                            )}
                          </div>
                          {t.newUserId && t.newPassword && (
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <a
                                href={`${portalUrl}/vendor/login?appId=${encodeURIComponent(
                                  t.newUserId
                                )}&pass=${encodeURIComponent(t.newPassword)}&auto=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open Upgraded Dashboard</span>
                              </a>
                              <a
                                href={getUpgradeCredentialsWhatsAppLink(
                                  currentMobile,
                                  currentName,
                                  lead.applicationId,
                                  t.requestedPlan,
                                  t.newUserId,
                                  t.newPassword,
                                  portalUrl
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
                              type="button"
                              onClick={() =>
                                setTicketActionModal({ ticket: t, type: "approve_and_issue" })
                              }
                              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Approve &amp; Issue Login</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTicketActionModal({ ticket: t, type: "reject" })
                              }
                              className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all cursor-pointer"
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

          {/* SECTION 8: Internal Vendor Operations Notes (Directly Editable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Internal Vendor Operations Notes</span>
              </label>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add fleet inspection remarks, document verification notes, or vehicle attachment checklist..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer (Sticky) */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete vendor record for ${editForm.fullName || lead.fullName}?`)) {
                onDelete(lead.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Vendor</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllDetails}
              disabled={savingAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingAll ? "Saving All Changes..." : "Save All Changes"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* 2-Step Ticket Action Confirmation Modal */}
      {ticketActionModal && (() => {
        const t = ticketActionModal.ticket;
        const feeCalc = calculateUpgradeFees(t.currentPlan, t.requestedPlan);
        const totalPayable = t.totalAmount || feeCalc.totalAmount;
        const reqTierUpper = (t.requestedPlan || "gold").toUpperCase();
        const suffix = t.ticketId.slice(-4) || t.applicationId.slice(-4) || "1000";
        const previewUserId = `BB-${reqTierUpper}-${suffix}`;
        const previewPassword = `BroomBoom@${reqTierUpper}2026`;

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {ticketActionModal.type === "reject" ? (
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
                  type="button"
                  onClick={() => setTicketActionModal(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="text-slate-500">
                  Ticket: <span className="text-slate-900 font-mono font-bold">#{t.ticketId}</span>
                </div>
                <div className="text-slate-500">
                  Vendor: <span className="text-slate-900 font-bold">{t.vendorName}</span> ({t.vendorMobile})
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

              {ticketActionModal.type !== "reject" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>New Plan Value:</span>
                      <span className="text-slate-900 font-semibold">
                        ₹{feeCalc.upgradeAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Gateway Fee (3%) + GST (5%):</span>
                      <span className="text-slate-900">
                        ₹{(feeCalc.gatewayFee + feeCalc.gstAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700 text-sm">
                      <span>Total Upgrade Fee:</span>
                      <span>
                        ₹{totalPayable.toLocaleString("en-IN")}{" "}
                        {t.paymentStatus === "PAID" ? "(PAID)" : ""}
                      </span>
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
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
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
                  Admin Notes / Remarks (Optional):
                </label>
                <textarea
                  value={ticketAdminNotes}
                  onChange={(e) => setTicketAdminNotes(e.target.value)}
                  placeholder="e.g., Fleet verification completed, territory exclusivity active..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTicketActionModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessTicket}
                  disabled={
                    submittingTicket ||
                    ((ticketActionModal.type === "approve_and_issue" ||
                      ticketActionModal.type === "step2_issue_creds") &&
                      !paymentConfirmed)
                  }
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                    ticketActionModal.type === "approve_and_issue" ||
                    ticketActionModal.type === "step2_issue_creds"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 disabled:opacity-50"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {submittingTicket
                    ? "Processing..."
                    : ticketActionModal.type === "approve_and_issue" ||
                      ticketActionModal.type === "step2_issue_creds"
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
