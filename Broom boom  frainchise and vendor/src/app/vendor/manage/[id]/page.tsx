"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Car,
  Phone,
  Mail,
  MessageCircle,
  Save,
  Key,
  RefreshCw,
  ExternalLink,
  Send,
  Copy,
  Check,
  CreditCard,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  FileText,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Clock,
  X,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VendorLead, LeadStatus, VendorUser, PlanChangeTicket, AdminActivityLog } from "@/types";
import {
  formatDate,
  getWhatsAppLink,
  getCredentialsWhatsAppLink,
  getUpgradeCredentialsWhatsAppLink,
  calculateUpgradeFees,
} from "@/lib/utils";

export default function VendorManagePage() {
  const params = useParams();
  const router = useRouter();
  const leadId = (params?.id as string) || "";

  const portalUrl =
    process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || "http://localhost:3000";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [franchiseCount, setFranchiseCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<VendorLead | null>(null);

  // Editable Form State
  const [editForm, setEditForm] = useState({
    fullName: "",
    mobile: "",
    alternatePhone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    proposedAddress: "",
    spaceStatus: "",
    carpetArea: "",
    preferredPackage: "silver",
    packageName: "",
    investmentBudget: "",
    financeRequired: "Self-Funded / Ready Capital",
    loanAssistance: "No (Self-Funded)",
    currentProfession: "",
    hasExperience: "",
    message: "",
    source: "apply_page",
    status: "new" as LeadStatus,
  });

  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savingCreds, setSavingCreds] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Credentials State
  const [credentials, setCredentials] = useState<VendorUser | null>(null);
  const [credForm, setCredForm] = useState({
    userId: "",
    password: "",
  });
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [generatingCreds, setGeneratingCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<PlanChangeTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketActionModal, setTicketActionModal] = useState<{
    ticket: PlanChangeTicket;
    type: "approve_and_issue" | "step1_approve" | "step2_issue_creds" | "mark_paid" | "reject";
  } | null>(null);
  const [ticketAdminNotes, setTicketAdminNotes] = useState("");
  const [ticketPaymentRef, setTicketPaymentRef] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Manual Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "21600",
    paymentMode: "Bank Transfer (NEFT/RTGS/IMPS)",
    paymentReference: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
    setApproved: false,
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Previous Activity State for this profile
  const [leadActivities, setLeadActivities] = useState<AdminActivityLog[]>([]);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchLeadActivities = async (targetAppId?: string) => {
    const appId = targetAppId || lead?.applicationId;
    if (!appId) return;
    try {
      setLoadingActivities(true);
      const res = await fetch(`/api/activity?entityId=${encodeURIComponent(appId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLeadActivities(data.logs);
      }
    } catch (e) {
      console.warn("Could not load lead activities:", e);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Load Lead details
  const fetchLeadDetails = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/leads/${leadId}`);
      const data = await res.json();
      if (data.success && data.lead) {
        const l = data.lead as VendorLead;
        setLead(l);
        setNotes(l.adminNotes || "");
        const tierLower = (l.preferredPackage || "gold").toLowerCase();
        const baseCost = tierLower === "silver" ? 10800 : tierLower === "platinum" ? 54000 : 21600;
        setPaymentForm((prev) => ({ ...prev, amount: String(baseCost) }));
        setEditForm({
          fullName: l.fullName || "",
          mobile: l.mobile || "",
          alternatePhone: l.alternatePhone || "",
          email: l.email || "",
          city: l.city || "",
          state: l.state || "",
          pincode: l.pincode || "",
          proposedAddress: l.proposedAddress || "",
          spaceStatus: l.spaceStatus || "Owned commercial space ready",
          carpetArea: l.carpetArea || "800 - 1,200 sq.ft (Ideal for Platinum Master)",
          preferredPackage: l.preferredPackage || "silver",
          packageName: l.packageName || `${(l.preferredPackage || "silver").toUpperCase()} Partner`,
          investmentBudget: l.investmentBudget || "₹50,000 (Platinum Package - 50% OFF Exclusive Deal)",
          financeRequired: l.financeRequired || "Self-Funded / Ready Capital",
          loanAssistance: l.loanAssistance || "No (Self-Funded)",
          currentProfession: l.currentProfession || "Tour & Travels, Taxi Fleet Owner",
          hasExperience: l.hasExperience || "Yes, currently in travel / taxi / logistics",
          message: l.message || "",
          source: l.source || "apply_page",
          status: (l.status as LeadStatus) || "new",
        });

        // Fetch credentials & tickets & previous activities
        fetchCredentialsForLead(l);
        fetchTicketsForLead(l);
        fetchLeadActivities(l.applicationId);
      } else {
        alert("Vendor lead not found");
      }
    } catch (e) {
      console.error("Error loading vendor lead:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentialsForLead = async (targetLead: VendorLead) => {
    try {
      setLoadingCreds(true);
      const res = await fetch(
        `/api/vendor/credentials?applicationId=${encodeURIComponent(
          targetLead.applicationId
        )}&mobile=${encodeURIComponent(targetLead.mobile)}`
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
        const rawTier = (targetLead.preferredPackage || "gold").toUpperCase();
        const suffix = targetLead.applicationId.replace(/[^0-9]/g, "").slice(-4) || "1000";
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

  const fetchTicketsForLead = async (targetLead: VendorLead) => {
    try {
      setLoadingTickets(true);
      const res = await fetch(
        `/api/vendor/tickets?applicationId=${encodeURIComponent(targetLead.applicationId)}`
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

  useEffect(() => {
    fetchLeadDetails();

    // Fetch sidebar counts
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
  }, [leadId]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // 1. Save specific section
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

  // 2. Save All Lead Details & Custom Credentials
  const handleSaveAllDetails = async () => {
    if (!lead) return;
    try {
      setSavingAll(true);

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

  // 3. Save Custom Credentials specifically
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

  // Record Dynamic Manual Payment
  const handleRecordPayment = async () => {
    if (!lead) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    try {
      setRecordingPayment(true);
      const res = await fetch("/api/vendor/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: lead.applicationId,
          amount: Number(paymentForm.amount),
          paymentMode: paymentForm.paymentMode,
          paymentReference: paymentForm.paymentReference || `MANUAL-${Date.now().toString().slice(-6)}`,
          paymentDate: paymentForm.paymentDate,
          notes: paymentForm.notes,
          setApproved: paymentForm.setApproved,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "Manual payment recorded successfully!");
        setShowPaymentModal(false);
        await fetchLeadDetails();
      } else {
        alert(data.error || "Failed to record manual payment.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to record manual payment.");
    } finally {
      setRecordingPayment(false);
    }
  };

  // 4. Reset / Auto-Generate Credentials
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

  // 5. Change Application Status
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setStatusLoading(true);
    setEditForm((prev) => ({ ...prev, status: newStatus }));
    try {
      const res = await fetch(`/api/vendor/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === "approved") {
          await fetchCredentialsForLead(lead);
          showNotification("Status set to Approved! Vendor license & dashboard access are active.");
        } else {
          showNotification(`Status updated to ${newStatus.toUpperCase()}`);
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // 6. Save Notes
  const handleSaveNotes = async () => {
    if (!lead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/vendor/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Internal operations notes saved!");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  // 7. Copy text helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 8. Delete Lead
  const handleDeleteLead = async () => {
    if (!lead) return;
    if (confirm(`Are you sure you want to delete vendor record for ${lead.fullName}?`)) {
      try {
        const res = await fetch(`/api/vendor/leads/${lead.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          router.push("/vendor");
        } else {
          alert(data.error || "Failed to delete lead");
        }
      } catch (err) {
        console.error("Error deleting lead:", err);
      }
    }
  };

  // 9. Process Ticket
  const handleProcessTicket = async () => {
    if (!ticketActionModal) return;
    const { ticket, type } = ticketActionModal;

    if ((type === "approve_and_issue" || type === "step2_issue_creds") && !paymentConfirmed) {
      alert("Please confirm the verification checkbox before proceeding.");
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
        if (lead) {
          await fetchTicketsForLead(lead);
          await fetchCredentialsForLead(lead);
        }
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

  const currentMobile = editForm.mobile || lead?.mobile || "";
  const currentEmail = editForm.email || lead?.email || "";
  const currentName = editForm.fullName || lead?.fullName || "Vendor Partner";
  const currentAppId = lead?.applicationId || "BB-VENDOR";

  const whatsAppGeneralUrl = getWhatsAppLink(
    currentMobile,
    currentName,
    currentAppId,
    "Vendor"
  );

  const activeUserId = credForm.userId || credentials?.userId || "";
  const activePassword = credForm.password || credentials?.password || "";
  const vendorDashboardUrl = `${portalUrl}/vendor/login?appId=${encodeURIComponent(
    activeUserId
  )}&pass=${encodeURIComponent(activePassword)}&auto=1`;

  const pendingTickets = tickets.filter((t) => t.status === "PENDING");

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          franchiseCount={franchiseCount}
          vendorSubCount={subCount}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            title="Vendor Management"
            subtitle="Loading details..."
            onRefresh={fetchLeadDetails}
            isRefreshing={true}
            onMenuToggle={() => setMobileMenuOpen(true)}
          />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Loading Vendor Details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          franchiseCount={franchiseCount}
          vendorSubCount={subCount}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            title="Vendor Management"
            subtitle="Not Found"
            onMenuToggle={() => setMobileMenuOpen(true)}
          />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Vendor Record Not Found</h3>
              <p className="text-xs text-slate-500">
                The requested vendor record could not be found or has been removed.
              </p>
              <Link
                href="/vendor"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Vendor Leads</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        franchiseCount={franchiseCount}
        vendorSubCount={subCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={`Manage Vendor: ${editForm.fullName || lead.fullName}`}
          subtitle={`App ID: ${lead.applicationId} • Registered ${formatDate(lead.createdAt)}`}
          onRefresh={fetchLeadDetails}
          isRefreshing={loading}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">
          {/* Breadcrumbs & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/vendor" className="hover:text-slate-800 transition-colors font-medium">
                Vendor Leads
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-800 truncate">
                Manage Vendor: {editForm.fullName || lead.fullName}
              </span>
            </div>

            <Link
              href="/vendor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs shadow-xs transition-all w-fit cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Vendor Leads</span>
            </Link>
          </div>

          {/* Hero Header Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <Car className="w-6 h-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {editForm.fullName || lead.fullName}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-emerald-700 font-semibold border border-slate-200">
                    {lead.applicationId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                      editForm.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : editForm.status === "in_progress" || editForm.status === "payment_completed"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : editForm.status === "pending" || editForm.status === "payment_pending"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : editForm.status === "rejected"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {editForm.status === "approved"
                      ? "Approved / Active"
                      : editForm.status === "in_progress" || editForm.status === "payment_completed"
                      ? "Paid - In Progress"
                      : editForm.status === "pending" || editForm.status === "payment_pending"
                      ? "Payment Pending"
                      : editForm.status === "contacted"
                      ? "Contacted"
                      : editForm.status === "rejected"
                      ? "Rejected"
                      : "New Application"}
                  </span>
                  {pendingTickets.length > 0 && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                      ⚡ Upgrade Ticket ({pendingTickets.length})
                    </span>
                  )}
                  {saveSuccessMsg && (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{saveSuccessMsg}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Registered on {formatDate(lead.createdAt)} via{" "}
                  <span className="font-semibold text-slate-700">{lead.source || "apply_page"}</span>
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                title="Record manual offline/online payment for this vendor"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              {activeUserId && activePassword && editForm.status === "approved" && (
                <a
                  href={vendorDashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-sm transition-all"
                  title="Launch Vendor Dashboard with 1-click automatic authentication"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Vendor Dashboard</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer border ${
                  showActivityDropdown
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
                title="View previous activities and admin changes on this vendor"
              >
                <History className="w-3.5 h-3.5 text-emerald-500" />
                <span>Previous Activity</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    showActivityDropdown
                      ? "bg-white/20 text-white"
                      : "bg-emerald-200 text-emerald-900"
                  }`}
                >
                  {leadActivities.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showActivityDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleSaveAllDetails}
                disabled={savingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingAll ? "Saving..." : "Save All Changes"}</span>
              </button>
            </div>
          </div>

          {/* Previous Activity Dropdown (Opens when clicked) */}
          {showActivityDropdown && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>
                    Previous Activity on {editForm.fullName || lead.fullName} ({leadActivities.length} Total Changes)
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/activity?query=${encodeURIComponent(lead.applicationId)}`}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Full Audit Logs</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowActivityDropdown(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {loadingActivities ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading previous activity logs...</p>
                </div>
              ) : leadActivities.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {leadActivities.map((act) => {
                    const badgeClass =
                      act.actionType === "APPROVE"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                        : act.actionType === "REJECT"
                        ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                        : act.actionType === "PAYMENT_RECORDED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                        : act.actionType.includes("CREDENTIALS")
                        ? "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                        : act.actionType === "STATUS_CHANGE"
                        ? "bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                        : "bg-blue-50 text-blue-700 border-blue-200 font-semibold";

                    return (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${badgeClass}`}
                            >
                              {act.actionType}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">#{act.id}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{act.title}</h4>
                          {act.details && (
                            <p className="text-slate-600 font-mono text-[11px] bg-white border border-slate-100 rounded-md p-2 whitespace-pre-wrap leading-relaxed">
                              {act.details}
                            </p>
                          )}
                        </div>
                        <div className="sm:text-right shrink-0 space-y-0.5">
                          <span className="text-[11px] font-semibold text-slate-700 block">
                            {act.adminName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatDate(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No previous activity recorded yet for this profile.
                </div>
              )}
            </div>
          )}

          {/* Quick Contact Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <a
              href={`tel:${currentMobile}`}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {currentMobile}</span>
            </a>

            <a
              href={whatsAppGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold text-xs shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {currentEmail && (
              <a
                href={`mailto:${currentEmail}`}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* SECTION 1: Applicant & Contact Details (Directly Editable) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Applicant &amp; Contact Information</span>
              </h3>
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
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "Contact Details" ? "Saving..." : "Save Contact"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Applicant Full Name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Vendor Application & License Status (Directly Interactive) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Vendor Application &amp; License Status</span>
              </h3>
              {editForm.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Active Vendor Partner
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2.5">
              {(
                [
                  {
                    id: "new",
                    label: "1. New",
                    color: "hover:border-blue-400 hover:bg-blue-50",
                    active: "bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs",
                  },
                  {
                    id: "pending",
                    label: "2. Payment Pending",
                    color: "hover:border-amber-400 hover:bg-amber-50",
                    active: "bg-amber-50 border-amber-500 text-amber-800 font-bold shadow-xs",
                  },
                  {
                    id: "in_progress",
                    label: "3. Paid - In Progress",
                    color: "hover:border-purple-400 hover:bg-purple-50",
                    active: "bg-purple-50 border-purple-500 text-purple-800 font-bold shadow-xs",
                  },
                  {
                    id: "approved",
                    label: "4. Approved / Active",
                    color: "hover:border-emerald-400 hover:bg-emerald-50",
                    active: "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs",
                  },
                  {
                    id: "rejected",
                    label: "Rejected",
                    color: "hover:border-rose-400 hover:bg-rose-50",
                    active: "bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs",
                  },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={statusLoading}
                  onClick={() => handleStatusChange(s.id as LeadStatus)}
                  className={`py-2.5 px-2 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    editForm.status === s.id ||
                    (s.id === "in_progress" && (editForm.status as any) === "payment_completed") ||
                    (s.id === "pending" && (editForm.status as any) === "payment_pending")
                      ? s.active
                      : `border-slate-200 bg-white text-slate-600 ${s.color}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * Approving this vendor automatically activates their license in PostgreSQL and issues login credentials to the Vendor Dashboard.
            </p>
          </div>

          {/* SECTION 3: VENDOR PORTAL LOGIN CREDENTIALS DESK (Directly Editable & Save) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Vendor Portal Login Credentials
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Vendor uses these credentials to log in at{" "}
                    <code className="text-emerald-700 font-mono font-semibold">/vendor/login</code>
                  </p>
                </div>
              </div>

              {editForm.status === "approved" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateCredentials(Boolean(credentials))}
                    disabled={generatingCreds}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                    title="Generate or reset default credentials format"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingCreds ? "animate-spin" : ""}`} />
                    <span>{credentials ? "Reset Password" : "Auto-Generate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    disabled={savingCreds}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Save manual changes to User ID and Password"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingCreds ? "Saving..." : "Save Credentials"}</span>
                  </button>
                </div>
              )}
            </div>

            {editForm.status !== "approved" ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">
                      Awaiting Admin Approval (Current Status: {editForm.status.toUpperCase()})
                    </p>
                    <p className="text-amber-800 mt-1 leading-relaxed">
                      As per company operations policy, vendor login credentials and portal dashboard access will only be generated and activated once the Admin officially Approves this vendor.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  <button
                    type="button"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("approved")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Vendor &amp; Generate Password Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs transition-all cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Record Manual Payment</span>
                  </button>
                </div>
              </div>
            ) : loadingCreds ? (
              <div className="py-4 text-center text-xs text-slate-500">Checking credentials...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* User ID Input */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
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
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-emerald-800 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
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
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Dispatch & Launch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href={vendorDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
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
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
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
                    className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Current Registered Tier &amp; Financial Terms</span>
              </h3>
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
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "Tier & Financials" ? "Saving..." : "Save Tier & Terms"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Finance Terms / Source
                </label>
                <select
                  value={editForm.financeRequired}
                  onChange={(e) => setEditForm({ ...editForm, financeRequired: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="No (Self-Funded)">No (Self-Funded)</option>
                  <option value="Yes Required">Yes Required</option>
                  <option value="Exploring Options">Exploring Options</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: Fleet Base & Office Location (Directly Editable) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Fleet Base &amp; Office Location</span>
              </h3>
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
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "Fleet Base & Office" ? "Saving..." : "Save Office Base"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  City / Base *
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="e.g. SINGUR"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* SECTION 6: Fleet Operations & Business Background (Directly Editable) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Fleet Operations &amp; Business Background</span>
              </h3>
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
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "Fleet Background" ? "Saving..." : "Save Fleet Info"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Current Profession / Fleet Business
                </label>
                <input
                  type="text"
                  value={editForm.currentProfession}
                  onChange={(e) => setEditForm({ ...editForm, currentProfession: e.target.value })}
                  placeholder="e.g. Tour & Travels, Taxi Fleet Owner"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Vendor Inquiry / Vehicle Breakdown Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  placeholder="e.g. 5 Swift Dzire, 3 Ertiga ready for attachment"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs focus:bg-white transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7: Plan Upgrade & Change Tickets */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Plan Upgrade &amp; Change Tickets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Requests submitted by vendor from their dashboard
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {tickets.length} total
              </span>
            </div>

            {loadingTickets ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No plan upgrade tickets raised by this vendor.
              </div>
            ) : (
              <div className="space-y-3">
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
                      className={`p-4 rounded-xl border text-xs space-y-3 ${
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
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              Step 1: Pending Review
                            </span>
                          )}
                          {isAwaitingPay && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                              Step 1 Approved: Awaiting Pay Now
                            </span>
                          )}
                          {isPaymentCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                              Step 2: Paid! Issue Login
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Upgraded &amp; Active
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
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
                            className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                        <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 italic text-[11px]">
                          &ldquo;{t.reason}&rdquo;
                        </p>
                      )}

                      {/* If Approved, show generated upgraded credentials */}
                      {isApproved && t.newUserId && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-800 font-semibold">
                              Upgraded Credentials Issued:
                            </span>
                            <span className="text-slate-500">
                              {t.approvedAt ? formatDate(t.approvedAt) : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-slate-800">
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
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
                                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-[11px] font-bold shadow-sm transition-all"
                              >
                                <Send className="w-3.5 h-3.5" />
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
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Approve &amp; Issue Login</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTicketActionModal({ ticket: t, type: "reject" })
                              }
                              className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all cursor-pointer"
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Internal Vendor Operations Notes</span>
              </label>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add fleet inspection remarks, document verification notes, or vehicle attachment checklist..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-between gap-3 sticky bottom-4 z-20">
            <button
              type="button"
              onClick={handleDeleteLead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Vendor</span>
            </button>

            <div className="flex items-center gap-2.5">
              <Link
                href="/vendor"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                Back to Leads
              </Link>

              <button
                type="button"
                onClick={handleSaveAllDetails}
                disabled={savingAll}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingAll ? "Saving All Changes..." : "Save All Changes"}</span>
              </button>
            </div>
          </div>
        </main>
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

      {/* Dynamic Manual Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
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
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Vendor Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-slate-900">{lead.fullName} ({lead.mobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application ID:</span>
                <span className="font-mono font-bold text-emerald-700">{lead.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Plan:</span>
                <span className="font-bold text-slate-800 uppercase">{editForm.preferredPackage} Partner</span>
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
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 21600"
                />
                {/* Quick Presets */}
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
                      onClick={() => setPaymentForm({ ...paymentForm, amount: p.val })}
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
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
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
                    value={paymentForm.paymentReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
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
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Admin Remarks / Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Direct bank deposit confirmed in BroomBoom operations account."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Toggle: In-Progress vs Approve Immediately */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.setApproved}
                    onChange={(e) => setPaymentForm({ ...paymentForm, setApproved: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Approve &amp; Generate Login Password Immediately
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      If checked, status becomes <strong>APPROVED</strong>, license is activated, and portal login credentials are created immediately.
                      If unchecked, status becomes <strong>IN PROGRESS</strong> for verification.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordingPayment}
                onClick={handleRecordPayment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{recordingPayment ? "Recording Payment..." : "Confirm & Save Payment"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}