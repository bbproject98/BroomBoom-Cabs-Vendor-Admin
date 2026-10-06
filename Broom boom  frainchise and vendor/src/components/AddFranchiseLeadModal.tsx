"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { PackageTier } from "@/types";

interface AddFranchiseLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFranchiseLeadModal: React.FC<AddFranchiseLeadModalProps> = ({
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
    preferredPackage: "gold" as PackageTier,
    investmentBudget: "₹5.0 Lakhs - ₹10.0 Lakhs",
    spaceStatus: "Owned commercial space ready",
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
      const res = await fetch("/api/franchise/leads", {
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
        alert(data.error || "Failed to add franchise lead");
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
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manual Franchise Lead Entry</h3>
              <p className="text-[11px] text-slate-500">Record an inquiry received via phone or visit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
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
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kolkata, Lucknow"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. West Bengal"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Package Tier</label>
              <select
                value={formData.preferredPackage}
                onChange={(e) =>
                  setFormData({ ...formData, preferredPackage: e.target.value as PackageTier })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              >
                <option value="silver">Silver (Booking Kiosk - ₹1.5L)</option>
                <option value="gold">Gold (District Hub - ₹5L-₹10L)</option>
                <option value="platinum">Platinum (Regional Master - ₹15L+)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Commercial Space</label>
              <select
                value={formData.spaceStatus}
                onChange={(e) => setFormData({ ...formData, spaceStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
              >
                <option value="Owned commercial space ready">Owned Commercial Space</option>
                <option value="Rented space identified">Rented Space Identified</option>
                <option value="Looking for space">Looking for Space</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Initial Admin Notes</label>
            <textarea
              rows={2}
              placeholder="Source details, caller background..."
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400"
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
              className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Franchise Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
