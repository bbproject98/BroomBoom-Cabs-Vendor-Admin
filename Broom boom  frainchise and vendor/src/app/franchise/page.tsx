"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FranchiseDetailModal } from "@/components/FranchiseDetailModal";
import { AddFranchiseLeadModal } from "@/components/AddFranchiseLeadModal";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  Building2,
  ChevronRight,
} from "lucide-react";
import { FranchiseLead, LeadStatus } from "@/types";
import { formatDate, getWhatsAppLink } from "@/lib/utils";

export default function FranchisePage() {
  const [leads, setLeads] = useState<FranchiseLead[]>([]);
  const [vendorCount, setVendorCount] = useState(0);
  const [vendorSubCount, setVendorSubCount] = useState(0);
  const [pendingTicketCount, setPendingTicketCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");

  const [selectedLead, setSelectedLead] = useState<FranchiseLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (packageFilter !== "all") params.append("package", packageFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/franchise/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }

      // Fetch stats for vendor and subscription badges
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setVendorCount(statsData.stats.vendor?.total || 0);
        setVendorSubCount(statsData.stats.subscriptions?.total || 0);
        setPendingTicketCount(statsData.stats.pendingTickets || statsData.stats.tickets?.pending || 0);
      }
    } catch (e) {
      console.error("Failed to load franchise leads:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, packageFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/franchise/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/franchise/leads/${id}`, {
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
        alert("Notes saved successfully!");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/franchise/leads/${id}`, {
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

  // Status counts
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const approvedCount = leads.filter((l) => l.status === "approved").length;

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={totalCount}
        vendorCount={vendorCount}
        vendorSubCount={vendorSubCount}
        pendingTicketCount={pendingTicketCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Franchise Leads Desk"
          subtitle="Direct franchise applications received from the Franchise Landing Page"
          onRefresh={fetchLeads}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto pb-24 lg:pb-8">
          {/* Section KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Inquiries
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                New / Unread
              </span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{newCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                In Contact
              </span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{contactedCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Approved Partners
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, city, or application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-400 shadow-sm"
              />
            </form>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-yellow-400 font-medium shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Package Tier Filter */}
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-yellow-400 font-medium shadow-sm"
              >
                <option value="all">All Packages</option>
                <option value="silver">Silver Partner (Kiosk)</option>
                <option value="gold">Gold Partner (District Hub)</option>
                <option value="platinum">Platinum Partner (Master)</option>
              </select>

              {/* Export CSV */}
              <a
                href="/api/export?type=franchise"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-600" />
                <span>Export CSV</span>
              </a>

              {/* Add Lead */}
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Franchise Lead</span>
              </button>
            </div>
          </div>

          {/* Mobile Franchise Leads Cards View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {leads.length > 0 ? (
              leads.map((lead) => {
                const whatsApp = getWhatsAppLink(
                  lead.mobile,
                  lead.fullName,
                  lead.applicationId,
                  "Franchise"
                );

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    {/* Header: App ID & Date */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">
                        {lead.applicationId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(lead.createdAt)}
                      </span>
                    </div>

                    {/* Applicant & Contact */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{lead.fullName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{lead.mobile}</p>
                      {lead.email && (
                        <p className="text-[11px] text-slate-400 truncate">{lead.email}</p>
                      )}
                    </div>

                    {/* City & Package Details */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Location</span>
                        <p className="font-semibold text-slate-800 truncate">{lead.city}, {lead.state || "—"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Package</span>
                        <p className="font-bold text-yellow-700 uppercase truncate">
                          {lead.preferredPackage} Partner
                        </p>
                      </div>
                    </div>

                    {/* Space & Budget */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                      <span>Space: <strong className="text-slate-800 font-medium">{lead.spaceStatus || lead.carpetArea || "—"}</strong></span>
                      <span>Budget: <strong className="text-slate-800 font-medium">{lead.investmentBudget || "Flexible"}</strong></span>
                    </div>

                    {/* Status Dropdown & Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border bg-white focus:outline-none ${
                          lead.status === "approved"
                            ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                            : lead.status === "contacted"
                            ? "text-amber-700 border-amber-300 bg-amber-50"
                            : lead.status === "review"
                            ? "text-purple-700 border-purple-300 bg-purple-50"
                            : lead.status === "rejected"
                            ? "text-rose-700 border-rose-300 bg-rose-50"
                            : "text-blue-700 border-blue-300 bg-blue-50"
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.mobile}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                        <a
                          href={whatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </a>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-sm text-slate-800">No franchise leads found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting search query or filters.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Franchise Leads Table */}
          <div className="hidden md:block rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Application</th>
                    <th className="py-3.5 px-4">Applicant & Contact</th>
                    <th className="py-3.5 px-4">City / Region</th>
                    <th className="py-3.5 px-4">Package & Budget</th>
                    <th className="py-3.5 px-4">Space Status</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Contact</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.length > 0 ? (
                    leads.map((lead) => {
                      const whatsApp = getWhatsAppLink(
                        lead.mobile,
                        lead.fullName,
                        lead.applicationId,
                        "Franchise"
                      );

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsDetailOpen(true);
                          }}
                        >
                          {/* Application ID */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                              {lead.applicationId}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {formatDate(lead.createdAt)}
                            </p>
                          </td>

                          {/* Applicant Name & Phone */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-xs">{lead.fullName}</p>
                            <p className="text-slate-600">{lead.mobile}</p>
                            {lead.email && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {lead.email}
                              </p>
                            )}
                          </td>

                          {/* City & State */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{lead.city}</p>
                            <p className="text-[11px] text-slate-500">
                              {lead.state || "—"}
                            </p>
                          </td>

                          {/* Package */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                lead.preferredPackage === "platinum"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : lead.preferredPackage === "gold"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {lead.preferredPackage} Partner
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {lead.investmentBudget || "Flexible"}
                            </p>
                          </td>

                          {/* Space */}
                          <td className="py-3.5 px-4 text-slate-700 max-w-[160px] truncate">
                            {lead.spaceStatus || lead.carpetArea || "—"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleUpdateStatus(lead.id, e.target.value as LeadStatus)
                              }
                              className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border bg-white focus:outline-none cursor-pointer ${
                                lead.status === "approved"
                                  ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                                  : lead.status === "contacted"
                                  ? "text-amber-700 border-amber-300 bg-amber-50"
                                  : lead.status === "review"
                                  ? "text-purple-700 border-purple-300 bg-purple-50"
                                  : lead.status === "rejected"
                                  ? "text-rose-700 border-rose-300 bg-rose-50"
                                  : "text-blue-700 border-blue-300 bg-blue-50"
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="review">In Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          {/* Quick Contact Buttons */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`tel:${lead.mobile}`}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                title={`Call ${lead.mobile}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={whatsApp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Detail View */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsDetailOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-yellow-400 hover:text-slate-950 text-slate-700 font-semibold text-[11px] transition-all"
                            >
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        {loading ? "Loading franchise leads..." : "No franchise leads match your criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Franchise Lead Detail Modal */}
      <FranchiseDetailModal
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDelete}
      />

      {/* Add Lead Modal */}
      <AddFranchiseLeadModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => fetchLeads()}
      />
    </div>
  );
}
