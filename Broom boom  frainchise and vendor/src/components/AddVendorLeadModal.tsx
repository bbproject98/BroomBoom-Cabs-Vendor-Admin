"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";

interface AddVendorLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddVendorLeadModal: React.FC<AddVendorLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    city: "",
    state: "",
    preferredPackage: "gold",
    spaceStatus: "Owned commercial office ready",
    currentProfession: "Taxi Fleet Operator (5+ Cabs)",
    adminNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.city) {
      alert("Name, Mobile, and City are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vendor/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "admin_manual_entry",
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || "Failed to add vendor lead");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">Manual Vendor / Fleet Registration</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Record an onboarding enquiry directly from a fleet operator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Vendor / Operator Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Suresh Kumar Travels"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="vendor@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kolkata, Lucknow"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. West Bengal"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Vendor Tier</label>
              <select
                value={formData.preferredPackage}
                onChange={(e) =>
                  setFormData({ ...formData, preferredPackage: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              >
                <option value="silver">Silver Partner (Booking Kiosk - 1-3 Cabs)</option>
                <option value="gold">Gold Partner (District Hub - 4-10 Cabs)</option>
                <option value="platinum">Platinum Partner (Regional Fleet - 10+ Cabs)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Fleet Background</label>
              <input
                type="text"
                placeholder="e.g. 5 Dzires & 2 Innovas"
                value={formData.currentProfession}
                onChange={(e) => setFormData({ ...formData, currentProfession: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Initial Admin Notes</label>
            <textarea
              rows={2}
              placeholder="Driver attachment details, inspection checklist remarks..."
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Vendor Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
