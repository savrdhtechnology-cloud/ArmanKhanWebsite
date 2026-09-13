import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { Clock, CheckCircle, Calendar, Phone, LogOut, BellRing, MessageCircle, Filter, TrendingUp } from "lucide-react";
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

export default function Staff() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("appointments");

  const { data: stats } = useQuery({
    queryKey: ["staff-stats"],
    queryFn: async () => (await api.get("/staff/stats")).data,
  });
  const { data: appts = [] } = useQuery({
    queryKey: ["staff-appts", filter],
    queryFn: async () => (await api.get("/staff/appointments", { params: filter ? { status: filter } : {} })).data,
  });
  const { data: followups = [] } = useQuery({
    queryKey: ["staff-followups"],
    queryFn: async () => (await api.get("/staff/followups")).data,
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/staff/appointments/${id}/status`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Status updated. Customer notified via email.");
    },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const followupMut = useMutation({
    mutationFn: async ({ id, at, note }) => (await api.patch(`/staff/appointments/${id}/followup`, { follow_up_at: at, follow_up_note: note })).data,
    onSuccess: () => { qc.invalidateQueries(); toast.success("Follow-up saved"); },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const setFollowup = (id) => {
    const input = window.prompt("Follow-up date-time (YYYY-MM-DD HH:MM, e.g., 2026-02-20 14:30). Leave blank to clear.");
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) { followupMut.mutate({ id, at: null, note: "" }); return; }
    const iso = new Date(trimmed.replace(" ", "T")).toISOString();
    if (isNaN(new Date(iso).getTime())) { toast.error("Invalid date-time"); return; }
    const note = window.prompt("Follow-up note (optional):") || "";
    followupMut.mutate({ id, at: iso, note });
  };

  return (
    <div data-testid="staff-page" className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <SectionLabel>Staff CRM</SectionLabel>
          <h1 className="font-playfair text-4xl text-white">Employee Portal</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white/60 text-sm hidden sm:block">
            <span className="text-brand-gold">{user?.name}</span> · <span className="uppercase text-[10px] tracking-widest">{user?.role}</span>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="btn-outline-gold !py-2 !px-4 !text-xs" data-testid="staff-logout">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
      <Divider className="!justify-start" />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Total" value={stats?.total ?? 0} testId="s-total" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} testId="s-pending" />
        <StatCard icon={CheckCircle} label="Confirmed" value={stats?.confirmed ?? 0} testId="s-confirmed" />
        <StatCard icon={CheckCircle} label="Completed" value={stats?.completed ?? 0} testId="s-completed" />
        <StatCard icon={Calendar} label="Today" value={stats?.today ?? 0} testId="s-today" />
        <StatCard icon={BellRing} label="Follow-ups Due" value={stats?.followups_due ?? 0} testId="s-followups" tone="text-yellow-400" />
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { k: "appointments", label: "My Appointments" },
          { k: "followups", label: `Follow-ups (${followups.length})` },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-5 py-2 text-xs uppercase tracking-[0.25em] border transition-all ${tab === t.k ? "bg-brand-gold text-black border-brand-gold" : "border-white/10 text-white/60 hover:border-brand-gold/40"}`}
            data-testid={`staff-tab-${t.k}`}
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
              <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1 border capitalize ${filter === s ? "border-brand-gold text-brand-gold" : "border-white/10 text-white/60"}`}>{s}</button>
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
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appts.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-white/40">No appointments assigned</td></tr>
                ) : appts.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`staff-appt-${a.id}`}>
                    <td className="p-4 text-white">
                      {a.name}
                      {a.follow_up_at && <div className="text-yellow-400 text-[10px] mt-1">⏰ {new Date(a.follow_up_at).toLocaleString()}</div>}
                    </td>
                    <td className="p-4 text-white/70">
                      <a href={`tel:${a.phone}`} className="hover:text-brand-gold flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</a>
                      <a href={`https://wa.me/91${a.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer" className="text-green-400 text-xs flex items-center gap-1 mt-1"><MessageCircle className="w-3 h-3" />WhatsApp</a>
                    </td>
                    <td className="p-4 text-brand-gold">{a.service}</td>
                    <td className="p-4 text-white/70">{a.date}<br /><span className="text-xs text-white/40">{a.time}</span></td>
                    <td className="p-4">
                      <select
                        className="bg-transparent border border-white/10 text-white/80 text-xs px-2 py-1 focus:border-brand-gold focus:outline-none capitalize"
                        value={a.status}
                        onChange={(e) => statusMut.mutate({ id: a.id, status: e.target.value })}
                        data-testid={`staff-status-${a.id}`}
                      >
                        {STATUS.map((s) => <option key={s} value={s} className="bg-[#111] capitalize">{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <button onClick={() => setFollowup(a.id)} className="text-yellow-400 hover:text-yellow-300 text-xs uppercase tracking-widest border border-yellow-400/30 px-2 py-1 flex items-center gap-1" data-testid={`follow-${a.id}`}>
                        <BellRing className="w-3 h-3" /> Follow-up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "followups" && (
        <div className="bg-[#111111] border border-white/5">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-yellow-400 text-xs uppercase tracking-[0.3em] flex items-center gap-2">
              <BellRing className="w-4 h-4" /> Follow-ups Due
            </h3>
          </div>
          {followups.length === 0 ? (
            <div className="p-10 text-center text-white/40">No pending follow-ups. You're all caught up ✂️</div>
          ) : (
            <div className="divide-y divide-white/5">
              {followups.map((a) => (
                <div key={a.id} className="p-5 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                  <div>
                    <div className="text-white font-playfair">{a.name} · <span className="text-brand-gold text-sm">{a.service}</span></div>
                    <div className="text-white/50 text-xs">{a.date} · {a.time}</div>
                    <div className="text-yellow-400 text-xs mt-1">⏰ Due: {new Date(a.follow_up_at).toLocaleString()}</div>
                    {a.follow_up_note && <div className="text-white/60 text-xs mt-1 italic">"{a.follow_up_note}"</div>}
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${a.phone}`} className="btn-outline-gold !py-2 !px-4 !text-xs"><Phone className="w-3 h-3" />Call</a>
                    <a href={`https://wa.me/91${a.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer" className="btn-outline-gold !py-2 !px-4 !text-xs"><MessageCircle className="w-3 h-3" />WhatsApp</a>
                    <button onClick={() => followupMut.mutate({ id: a.id, at: null, note: "" })} className="text-white/60 hover:text-brand-gold text-xs uppercase tracking-widest border border-white/10 px-3">Clear</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
