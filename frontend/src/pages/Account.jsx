import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { Calendar, XCircle, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  pending: "text-yellow-400 border-yellow-400/40",
  confirmed: "text-green-400 border-green-400/40",
  cancelled: "text-red-400 border-red-400/40",
  completed: "text-blue-400 border-blue-400/40",
};

export default function Account() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [prof, setProf] = useState({ name: user?.name || "", phone: user?.phone || "" });

  const { data: appts = [] } = useQuery({
    queryKey: ["my-appts"],
    queryFn: async () => (await api.get("/appointments/mine")).data,
  });

  const cancelMut = useMutation({
    mutationFn: async (id) => (await api.patch(`/appointments/${id}/cancel`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-appts"] }); toast.success("Cancelled"); },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  const saveMut = useMutation({
    mutationFn: async () => (await api.patch("/auth/profile", prof)).data,
    onSuccess: (data) => { setUser({ ...user, ...data }); setEditing(false); toast.success("Profile updated"); },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  return (
    <div data-testid="account-page" className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
      <SectionLabel>Customer Portal</SectionLabel>
      <h1 className="font-playfair text-4xl text-white">My <span className="text-brand-gold italic">Account</span></h1>
      <Divider className="!justify-start" />

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#111111] border border-white/5 p-6 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em]">Profile</h3>
            {!editing && <button onClick={() => setEditing(true)} className="text-white/60 hover:text-brand-gold"><Edit2 className="w-4 h-4" /></button>}
          </div>
          {editing ? (
            <div className="space-y-3">
              <input className="luxury-input" value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} placeholder="Name" data-testid="prof-name" />
              <input className="luxury-input" value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} placeholder="Phone" data-testid="prof-phone" />
              <div className="flex gap-2">
                <button className="btn-gold !py-2 !px-4 !text-xs" onClick={() => saveMut.mutate()}>Save</button>
                <button className="btn-outline-gold !py-2 !px-4 !text-xs" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div><span className="text-white/40">Name: </span><span className="text-white">{user?.name}</span></div>
              <div><span className="text-white/40">Email: </span><span className="text-white">{user?.email}</span></div>
              <div><span className="text-white/40">Phone: </span><span className="text-white">{user?.phone || "—"}</span></div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-[#111111] border border-white/5 p-6">
          <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> My Appointments</h3>
          {appts.length === 0 ? (
            <div className="text-white/50 text-sm py-6 text-center">
              No appointments yet. <Link to="/contact" className="text-brand-gold underline">Book one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appts.map((a) => (
                <div key={a.id} className="border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid={`appt-${a.id}`}>
                  <div>
                    <div className="text-white font-playfair">{a.service}</div>
                    <div className="text-white/50 text-xs">{a.date} · {a.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 border ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <button onClick={() => cancelMut.mutate(a.id)} className="text-white/50 hover:text-red-400" title="Cancel" data-testid={`cancel-${a.id}`}>
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link to="/contact" className="btn-gold" data-testid="book-new"><Calendar className="w-4 h-4" /> Book New Appointment</Link>
    </div>
  );
}
