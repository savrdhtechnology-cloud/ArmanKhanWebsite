import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { Users, Calendar, CheckCircle, Clock, TrendingUp, LogOut, Filter, Phone, UserPlus, Trash2, UserCog, AlertCircle, Trophy, Medal, Award, Zap, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS = ["pending", "confirmed", "completed", "cancelled"];

const StatCard = ({ icon: Icon, label, value, testId, tone }) => (
  <div className="bg-[#111111] border border-white/5 p-6" data-testid={testId}>
    <Icon className={`w-6 h-6 mb-3 ${tone || "text-brand-gold"}`} strokeWidth={1.5} />
    <div className="text-3xl font-playfair text-white">{value}</div>
    <div className="text-white/50 text-xs uppercase tracking-[0.25em] mt-1">{label}</div>
  </div>
);

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("appointments");
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [perfPeriod, setPerfPeriod] = useState("week");

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get("/admin/stats")).data });
  const { data: appts = [] } = useQuery({
    queryKey: ["admin-appts", filter],
    queryFn: async () => (await api.get("/admin/appointments", { params: filter ? { status: filter } : {} })).data,
  });
  const { data: customers = [] } = useQuery({ queryKey: ["admin-customers"], queryFn: async () => (await api.get("/admin/customers")).data });
  const { data: staff = [] } = useQuery({ queryKey: ["admin-staff"], queryFn: async () => (await api.get("/admin/staff")).data });
  const { data: settings } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await api.get("/admin/settings")).data });
  const { data: perf } = useQuery({
    queryKey: ["admin-performance", perfPeriod],
    queryFn: async () => (await api.get("/admin/staff/performance", { params: { period: perfPeriod } })).data,
    enabled: tab === "performance",
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/admin/appointments/${id}`, { status })).data,
    onSuccess: () => { qc.invalidateQueries(); toast.success("Status updated · email sent"); },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const assignMut = useMutation({
    mutationFn: async ({ id, staff_id }) => (await api.patch(`/admin/appointments/${id}/assign`, { staff_id: staff_id || null })).data,
    onSuccess: () => { qc.invalidateQueries(); toast.success("Lead assigned"); },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const addStaffMut = useMutation({
    mutationFn: async () => (await api.post("/admin/staff", staffForm)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setStaffForm({ name: "", email: "", phone: "", password: "" });
      toast.success("Staff added");
    },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const deleteStaffMut = useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/staff/${id}`)).data,
    onSuccess: () => { qc.invalidateQueries(); toast.success("Staff removed"); },
  });

  const toggleAutoAssignMut = useMutation({
    mutationFn: async (enabled) => (await api.patch("/admin/settings", { auto_assign_enabled: enabled })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(`Auto-assign ${data.auto_assign_enabled ? "ON" : "OFF"}`);
    },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  return (
    <div data-testid="admin-page" className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <SectionLabel>Admin CRM</SectionLabel>
          <h1 className="font-playfair text-4xl text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto-assign toggle */}
          <label className="flex items-center gap-2 border border-white/10 px-3 py-2 cursor-pointer hover:border-brand-gold/50 transition-colors" data-testid="auto-assign-toggle">
            <Zap className={`w-4 h-4 ${settings?.auto_assign_enabled ? "text-brand-gold" : "text-white/30"}`} />
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/70">Auto-Assign</span>
            <button
              type="button"
              onClick={() => toggleAutoAssignMut.mutate(!settings?.auto_assign_enabled)}
              className={`relative w-9 h-5 transition-colors ${settings?.auto_assign_enabled ? "bg-brand-gold" : "bg-white/20"}`}
              aria-label="Toggle auto-assign"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-[#050505] transition-transform ${settings?.auto_assign_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </label>
          <div className="text-white/60 text-sm hidden sm:block">Welcome, <span className="text-brand-gold">{user?.name}</span></div>
          <button onClick={() => { logout(); navigate("/"); }} className="btn-outline-gold !py-2 !px-4 !text-xs" data-testid="admin-logout"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </div>
      <Divider className="!justify-start" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
        <StatCard icon={TrendingUp} label="Total Leads" value={stats?.total_leads ?? 0} testId="stat-total" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} testId="stat-pending" />
        <StatCard icon={CheckCircle} label="Confirmed" value={stats?.confirmed ?? 0} testId="stat-confirmed" />
        <StatCard icon={Calendar} label="Today" value={stats?.today ?? 0} testId="stat-today" />
        <StatCard icon={AlertCircle} label="Unassigned" value={stats?.unassigned ?? 0} testId="stat-unassigned" tone="text-yellow-400" />
        <StatCard icon={Users} label="Customers" value={stats?.customers ?? 0} testId="stat-customers" />
        <StatCard icon={UserCog} label="Staff" value={stats?.staff ?? 0} testId="stat-staff" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { k: "appointments", label: "Appointments" },
          { k: "performance", label: "Performance" },
          { k: "staff", label: "Staff / CRM" },
          { k: "customers", label: "Customers" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-5 py-2 text-xs uppercase tracking-[0.25em] border transition-all ${tab === t.k ? "bg-brand-gold text-black border-brand-gold" : "border-white/10 text-white/60 hover:border-brand-gold/40"}`}
            data-testid={`tab-${t.k}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appointments" && (
        <div className="bg-[#111111] border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-brand-gold" />
            <button onClick={() => setFilter("")} className={`text-xs px-3 py-1 border ${!filter ? "border-brand-gold text-brand-gold" : "border-white/10 text-white/60"}`}>All</button>
            {STATUS.map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1 border capitalize ${filter === s ? "border-brand-gold text-brand-gold" : "border-white/10 text-white/60"}`} data-testid={`filter-${s}`}>{s}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-gold text-[10px] uppercase tracking-[0.25em] border-b border-white/5">
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Service</th>
                  <th className="text-left p-4">Slot</th>
                  <th className="text-left p-4">Assigned To</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {appts.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-white/40">No appointments</td></tr>
                ) : appts.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`admin-appt-${a.id}`}>
                    <td className="p-4 text-white">{a.name}</td>
                    <td className="p-4 text-white/70">
                      <a href={`tel:${a.phone}`} className="hover:text-brand-gold flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</a>
                      <div className="text-xs text-white/40">{a.email}</div>
                    </td>
                    <td className="p-4 text-brand-gold">{a.service}</td>
                    <td className="p-4 text-white/70">{a.date}<br /><span className="text-xs text-white/40">{a.time}</span></td>
                    <td className="p-4">
                      <select
                        className="bg-transparent border border-white/10 text-white/80 text-xs px-2 py-1 focus:border-brand-gold focus:outline-none"
                        value={a.assigned_to || ""}
                        onChange={(e) => assignMut.mutate({ id: a.id, staff_id: e.target.value })}
                        data-testid={`assign-${a.id}`}
                      >
                        <option value="" className="bg-[#111]">— Unassigned —</option>
                        {staff.map((s) => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        className="bg-transparent border border-white/10 text-white/80 text-xs px-2 py-1 focus:border-brand-gold focus:outline-none"
                        value={a.status}
                        onChange={(e) => statusMut.mutate({ id: a.id, status: e.target.value })}
                        data-testid={`status-select-${a.id}`}
                      >
                        {STATUS.map((s) => <option key={s} value={s} className="bg-[#111] capitalize">{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "performance" && (
        <div data-testid="performance-tab" className="space-y-6">
          {/* Period filter + summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { k: "week", label: "This Week" },
                { k: "last_week", label: "Last Week" },
                { k: "month", label: "This Month" },
                { k: "all", label: "All Time" },
              ].map((p) => (
                <button
                  key={p.k}
                  onClick={() => setPerfPeriod(p.k)}
                  className={`text-xs px-4 py-2 border transition-all ${perfPeriod === p.k ? "border-brand-gold text-brand-gold" : "border-white/10 text-white/60 hover:border-brand-gold/40"}`}
                  data-testid={`perf-period-${p.k}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="text-white/50 text-sm">
              <span className="text-brand-gold">{perf?.total_leads ?? 0}</span> leads · <span className="text-yellow-400">{perf?.unassigned ?? 0}</span> unassigned
            </div>
          </div>

          {/* Leaderboard cards */}
          {(perf?.leaderboard || []).length === 0 ? (
            <div className="bg-[#111111] border border-white/5 p-16 text-center text-white/40">
              No staff or leads in this period yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {perf.leaderboard.map((s, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? Trophy : rank === 2 ? Medal : rank === 3 ? Award : null;
                const medalColor = rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-orange-400" : "text-white/40";
                const rankLabel = rank === 1 ? "🥇 CHAMPION" : rank === 2 ? "🥈 RUNNER-UP" : rank === 3 ? "🥉 THIRD" : `#${rank}`;
                const won = s.confirmed + s.completed;
                return (
                  <div
                    key={s.id}
                    className={`relative bg-[#111111] border p-6 transition-all hover:-translate-y-1 ${rank === 1 ? "border-brand-gold" : "border-white/5 hover:border-brand-gold/40"}`}
                    data-testid={`perf-card-${s.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className={`text-[10px] uppercase tracking-[0.25em] mb-1 ${medalColor}`}>{rankLabel}</div>
                        <h3 className="font-playfair text-2xl text-white">{s.name}</h3>
                        <div className="text-white/40 text-xs">{s.email}</div>
                      </div>
                      {medal && React.createElement(medal, { className: `w-8 h-8 ${medalColor}`, strokeWidth: 1.4 })}
                    </div>

                    {/* Conversion big number */}
                    <div className="border-y border-white/5 py-4 my-4">
                      <div className="text-white/50 text-[10px] uppercase tracking-[0.3em] mb-1">Conversion Rate</div>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-playfair text-5xl ${s.conversion >= 60 ? "text-brand-gold" : s.conversion >= 30 ? "text-yellow-400" : "text-white/60"}`}>{s.conversion}%</span>
                        <span className="text-white/40 text-xs">of {s.assigned} assigned</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-1 bg-white/10 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-gold to-yellow-400 transition-all duration-1000"
                          style={{ width: `${Math.min(s.conversion, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-green-400 font-playfair text-xl">{s.confirmed}</div>
                        <div className="text-white/40 text-[9px] uppercase tracking-widest">Confirmed</div>
                      </div>
                      <div>
                        <div className="text-brand-gold font-playfair text-xl">{s.completed}</div>
                        <div className="text-white/40 text-[9px] uppercase tracking-widest">Done</div>
                      </div>
                      <div>
                        <div className="text-yellow-400 font-playfair text-xl">{s.pending}</div>
                        <div className="text-white/40 text-[9px] uppercase tracking-widest">Pending</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-playfair text-xl">{s.cancelled}</div>
                        <div className="text-white/40 text-[9px] uppercase tracking-widest">Lost</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white/50">Won leads</span>
                      <span className="text-brand-gold font-playfair text-lg">{won}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total leads legend */}
          <div className="bg-[#0A0A0A] border border-white/5 p-6 flex flex-wrap items-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Confirmed</div>
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-brand-gold" /> Completed = Revenue</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" /> Pending Follow-up</div>
            <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Lost / Cancelled</div>
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add staff */}
          <div className="bg-[#111111] border border-brand-gold/30 p-6 lg:col-span-1" data-testid="add-staff-card">
            <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add Staff</h3>
            <div className="space-y-3">
              <input className="luxury-input" placeholder="Full Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} data-testid="staff-name" />
              <input className="luxury-input" type="email" placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} data-testid="staff-email" />
              <input className="luxury-input" placeholder="Phone" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} data-testid="staff-phone" />
              <input className="luxury-input" type="password" placeholder="Password (min 6)" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} data-testid="staff-password" />
              <button
                className="btn-gold w-full"
                onClick={() => addStaffMut.mutate()}
                disabled={!staffForm.name || !staffForm.email || !staffForm.password || addStaffMut.isPending}
                data-testid="staff-submit"
              >
                {addStaffMut.isPending ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </div>

          {/* Staff list */}
          <div className="bg-[#111111] border border-white/5 lg:col-span-2">
            <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em] p-6 pb-3 flex items-center gap-2"><UserCog className="w-4 h-4" /> Team ({staff.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-gold text-[10px] uppercase tracking-[0.25em] border-b border-white/5">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Assigned</th>
                  <th className="text-left p-4">Pending</th>
                  <th className="text-left p-4"></th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/40">No staff yet — add one to start delegating leads.</td></tr>
                ) : staff.map((s) => (
                  <tr key={s.id} className="border-b border-white/5" data-testid={`staff-row-${s.id}`}>
                    <td className="p-4 text-white">
                      {s.name}
                      <div className="text-white/40 text-[10px] uppercase tracking-widest">Telecaller</div>
                    </td>
                    <td className="p-4 text-white/70">{s.email}<div className="text-xs text-white/40">{s.phone || "—"}</div></td>
                    <td className="p-4 text-brand-gold">{s.assigned_count}</td>
                    <td className="p-4 text-yellow-400">{s.pending_count}</td>
                    <td className="p-4">
                      <button onClick={() => { if (window.confirm(`Remove ${s.name}?`)) deleteStaffMut.mutate(s.id); }} className="text-red-400 hover:text-red-300" data-testid={`delete-staff-${s.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="bg-[#111111] border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-gold text-[10px] uppercase tracking-[0.25em] border-b border-white/5">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-white/40">No customers yet</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-white/5" data-testid={`admin-cust-${c.id}`}>
                  <td className="p-4 text-white">{c.name}</td>
                  <td className="p-4 text-white/70">{c.email}</td>
                  <td className="p-4 text-white/70">{c.phone || "—"}</td>
                  <td className="p-4 text-brand-gold">{c.appointment_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
