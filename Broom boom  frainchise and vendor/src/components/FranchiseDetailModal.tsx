"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Building,
  MessageCircle,
  FileText,
  Trash2,
  Save,
} from "lucide-react";
import { FranchiseLead, LeadStatus } from "@/types";
import { formatDate, getWhatsAppLink } from "@/lib/utils";

interface FranchiseDetailModalProps {
  lead: FranchiseLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const FranchiseDetailModal: React.FC<FranchiseDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
}) => {
  if (!isOpen || !lead) return null;

  const [notes, setNotes] = useState(lead.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onUpdateNotes(lead.id, notes);
    setSavingNotes(false);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatusLoading(true);
    await onUpdateStatus(lead.id, newStatus);
    setStatusLoading(false);
  };

  const whatsAppUrl = getWhatsAppLink(
    lead.mobile,
    lead.fullName,
    lead.applicationId,
    "Franchise"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{lead.fullName}</h3>
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  {lead.applicationId}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Applied on {formatDate(lead.createdAt)} via {lead.source || "Portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <a
              href={`tel:${lead.mobile}`}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {lead.mobile}</span>
            </a>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold text-xs shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Application Status
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {(
                [
                  { id: "new", label: "New", color: "hover:border-blue-400 hover:bg-blue-50", active: "bg-blue-50 border-blue-400 text-blue-700" },
                  { id: "contacted", label: "Contacted", color: "hover:border-amber-400 hover:bg-amber-50", active: "bg-amber-50 border-amber-400 text-amber-700" },
                  { id: "review", label: "In Review", color: "hover:border-purple-400 hover:bg-purple-50", active: "bg-purple-50 border-purple-400 text-purple-700" },
                  { id: "approved", label: "Approved", color: "hover:border-emerald-400 hover:bg-emerald-50", active: "bg-emerald-50 border-emerald-400 text-emerald-700" },
                  { id: "rejected", label: "Rejected", color: "hover:border-rose-400 hover:bg-rose-50", active: "bg-rose-50 border-rose-400 text-rose-700" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  disabled={statusLoading}
                  onClick={() => handleStatusChange(s.id)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all ${
                    lead.status === s.id
                      ? s.active
                      : `border-slate-200 bg-white text-slate-600 ${s.color}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-500 font-medium block">Package Selected</span>
              <p className="text-sm font-bold text-slate-900 uppercase">
                {lead.packageName || `${lead.preferredPackage} Partner`}
              </p>
              <div className="text-slate-600">
                Budget: <span className="text-slate-900 font-semibold">{lead.investmentBudget || "Flexible"}</span>
              </div>
              <div className="text-slate-600">
                Finance: <span className="text-slate-900 font-semibold">{lead.financeRequired || "Self-Funded"}</span>
              </div>
              <div className="text-slate-600">
                Loan Assistance: <span className="text-slate-900 font-semibold">{lead.loanAssistance || "No"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-500 font-medium block">Location & Property</span>
              <p className="text-sm font-bold text-slate-900">
                {lead.city}{lead.state ? `, ${lead.state}` : ""}
              </p>
              {lead.pincode && <div className="text-slate-500">PIN: {lead.pincode}</div>}
              <div className="text-slate-600">
                Space: <span className="text-slate-900 font-semibold">{lead.spaceStatus || "Not specified"}</span>
              </div>
              <div className="text-slate-600">
                Carpet Area: <span className="text-slate-900 font-semibold">{lead.carpetArea || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {lead.currentProfession && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Profession / Background:</span>
                <p className="text-slate-800 font-medium">{lead.currentProfession}</p>
              </div>
            )}

            {lead.hasExperience && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Industry Experience:</span>
                <p className="text-slate-800 font-medium">{lead.hasExperience}</p>
              </div>
            )}

            {lead.message && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Applicant Note / Inquiries:</span>
                <p className="text-slate-700 italic">{lead.message}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Internal Admin Notes</span>
              </label>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add follow-up notes, territory discussion remarks, or manager assignments..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Delete application for ${lead.fullName}?`)) {
                onDelete(lead.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
