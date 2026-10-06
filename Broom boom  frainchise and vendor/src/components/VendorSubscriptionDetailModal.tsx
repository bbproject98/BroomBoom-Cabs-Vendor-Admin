"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  CreditCard,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Building2,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { VendorSubscription, SubscriptionStatus } from "@/types";
import { formatDate, getWhatsAppLink } from "@/lib/utils";

interface VendorSubscriptionDetailModalProps {
  subscription: VendorSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: SubscriptionStatus) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const VendorSubscriptionDetailModal: React.FC<VendorSubscriptionDetailModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
}) => {
  if (!isOpen || !subscription) return null;

  const [notes, setNotes] = useState(subscription.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setNotes(subscription.adminNotes || "");
  }, [subscription]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onUpdateNotes(subscription.id, notes);
    setSavingNotes(false);
  };

  const handleStatusChange = async (newStatus: SubscriptionStatus) => {
    setStatusLoading(true);
    await onUpdateStatus(subscription.id, newStatus);
    setStatusLoading(false);
  };

  const whatsAppMessage = `Hello ${subscription.vendorName}, regarding your BroomBoom Vendor Subscription (${subscription.subscriptionId}) for ${subscription.planName}.`;
  const cleanPhone = (subscription.vendorMobile || "").replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsAppMessage)}`;

  const isPlatinum = subscription.planTier?.toLowerCase() === "platinum";
  const isGold = subscription.planTier?.toLowerCase() === "gold";
  const isSilver = subscription.planTier?.toLowerCase() === "silver";

  const tierBadgeClass = isPlatinum
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : isGold
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-700 border-slate-200";

  const isPaid = subscription.paymentStatus?.toUpperCase() === "PAID";
  const isActive = subscription.status === "active";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg border shrink-0 ${
                isPlatinum
                  ? "bg-purple-100 border-purple-200 text-purple-700"
                  : isGold
                  ? "bg-amber-100 border-amber-200 text-amber-700"
                  : "bg-emerald-100 border-emerald-200 text-emerald-700"
              }`}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[180px] sm:max-w-none">{subscription.vendorName}</h3>
                <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-100 text-emerald-700 font-bold border border-slate-200">
                  {subscription.subscriptionId}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tierBadgeClass}`}>
                  {subscription.planTier}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Application: <span className="text-slate-700 font-medium">{subscription.applicationId}</span> • Created{" "}
                {formatDate(subscription.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto text-xs">
          {/* Quick Communication Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <a
              href={`tel:${subscription.vendorMobile}`}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {subscription.vendorMobile}</span>
            </a>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {subscription.vendorEmail && (
              <a
                href={`mailto:${subscription.vendorEmail}`}
                className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Subscription & Package Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Package & Plan Terms */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Plan &amp; Licensing
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : subscription.status === "pending"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Name:</span>
                  <span className="text-slate-900 font-semibold text-right">{subscription.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Territory Scope:</span>
                  <span className="text-slate-700 font-medium text-right">
                    {subscription.territoryScope || "Standard Hub Territory"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Exclusivity:</span>
                  <span className="font-semibold text-emerald-700">
                    {subscription.hasExclusivity ? "Yes - Protected Territory" : "No - Shared Ward Hub"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Location:</span>
                  <span className="text-slate-700 font-medium">
                    {subscription.city}
                    {subscription.state ? `, ${subscription.state}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="text-slate-700">{subscription.billingCycle}</span>
                </div>
              </div>
            </div>

            {/* Validity & License Timeline */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Subscription Period
              </span>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="text-slate-900 font-medium">{formatDate(subscription.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End Date (1 Year):</span>
                  <span className="text-slate-900 font-medium">
                    {subscription.endDate ? formatDate(subscription.endDate) : "12 Months from Activation"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Completed At:</span>
                  <span className="text-emerald-700 font-medium">
                    {subscription.paidAt ? formatDate(subscription.paidAt) : "Pending Gateway Verification"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Record Created:</span>
                  <span className="text-slate-500">{formatDate(subscription.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cashfree Financial & Payment Record Card */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cashfree Payment Ledger &amp; Breakdown
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded font-bold text-xs uppercase tracking-wider border ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : subscription.paymentStatus === "ACTIVE"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : subscription.paymentStatus === "FAILED"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}
              >
                Status: {subscription.paymentStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order IDs & Session */}
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Merchant Order ID</span>
                  <span className="font-mono text-xs font-bold text-slate-900 break-all">{subscription.orderId}</span>
                </div>
                {subscription.cfOrderId && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">Cashfree Order ID</span>
                    <span className="font-mono text-xs text-slate-700 break-all">{subscription.cfOrderId}</span>
                  </div>
                )}
                {subscription.paymentSessionId && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">Payment Session</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate block max-w-xs">
                      {subscription.paymentSessionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Charges Breakdown */}
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Base Plan Fee:</span>
                  <span className="text-slate-800 font-medium">₹{subscription.baseAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>3% Gateway Processing Fee:</span>
                  <span className="text-slate-700">₹{subscription.gatewayFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>5% GST / Govt Tax:</span>
                  <span className="text-slate-700">₹{subscription.gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">Total Amount:</span>
                  <span className="text-base font-black text-emerald-700">
                    ₹{subscription.totalAmount.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">{subscription.currency}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Manage Subscription Status */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Update Subscription Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["active", "pending", "cancelled", "expired"] as SubscriptionStatus[]).map((statusKey) => (
                <button
                  key={statusKey}
                  disabled={statusLoading || subscription.status === statusKey}
                  onClick={() => handleStatusChange(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                    subscription.status === statusKey
                      ? statusKey === "active"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : statusKey === "pending"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusKey === "active" && "✓ "}
                  {statusKey}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Notes Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Admin &amp; Operations Audit Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add audit verification notes, KYC verification status, or territory assignment details..."
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs"
            />
            <div className="flex justify-end">
              <button
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete subscription ${subscription.subscriptionId}? This action cannot be undone.`
                )
              ) {
                await onDelete(subscription.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Record</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

