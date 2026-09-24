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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{lead.fullName}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-yellow-400 font-semibold border border-slate-700">
                  {lead.applicationId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Applied on {formatDate(lead.createdAt)} via {lead.source || "Portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <a
              href={`tel:${lead.mobile}`}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-md transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {lead.mobile}</span>
            </a>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold text-xs shadow-md transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </a>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Application Status
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { id: "new", label: "New", color: "hover:border-blue-500 hover:bg-blue-500/10", active: "bg-blue-500/20 border-blue-500 text-blue-400" },
                  { id: "contacted", label: "Contacted", color: "hover:border-amber-500 hover:bg-amber-500/10", active: "bg-amber-500/20 border-amber-500 text-amber-400" },
                  { id: "review", label: "In Review", color: "hover:border-purple-500 hover:bg-purple-500/10", active: "bg-purple-500/20 border-purple-500 text-purple-400" },
                  { id: "approved", label: "Approved", color: "hover:border-emerald-500 hover:bg-emerald-500/10", active: "bg-emerald-500/20 border-emerald-500 text-emerald-400" },
                  { id: "rejected", label: "Rejected", color: "hover:border-rose-500 hover:bg-rose-500/10", active: "bg-rose-500/20 border-rose-500 text-rose-400" },
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 font-medium block">Package Selected</span>
              <p className="text-sm font-bold text-yellow-400 uppercase">
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
              <span className="text-slate-400 font-medium block">Location & Property</span>
              <p className="text-sm font-bold text-white">
                {lead.city}{lead.state ? `, ${lead.state}` : ""}
              </p>
              {lead.pincode && <div className="text-slate-400">PIN: {lead.pincode}</div>}
              <div className="text-slate-300">
                Space: <span className="text-white font-medium">{lead.spaceStatus || "Not specified"}</span>
              </div>
              <div className="text-slate-300">
                Carpet Area: <span className="text-white font-medium">{lead.carpetArea || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {lead.currentProfession && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Profession / Background:</span>
                <p className="text-slate-200 font-medium">{lead.currentProfession}</p>
              </div>
            )}

            {lead.hasExperience && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Industry Experience:</span>
                <p className="text-slate-200 font-medium">{lead.hasExperience}</p>
              </div>
            )}

            {lead.message && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Applicant Note / Inquiries:</span>
                <p className="text-slate-300 italic">{lead.message}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-yellow-400" />
                <span>Internal Admin Notes</span>
              </label>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
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
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Delete application for ${lead.fullName}?`)) {
                onDelete(lead.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
