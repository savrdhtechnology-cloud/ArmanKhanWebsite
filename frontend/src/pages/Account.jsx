import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Divider, SectionLabel } from "@/components/Divider";
import { Calendar, XCircle, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, Stagger, StaggerItem, EASE } from "@/components/Motion";

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
      <Stagger animateOnMount stagger={0.1}>
        <StaggerItem><SectionLabel>Customer Portal</SectionLabel></StaggerItem>
        <StaggerItem as="h1" className="font-playfair text-4xl text-white">My <span className="text-brand-gold italic">Account</span></StaggerItem>
        <StaggerItem><Divider className="!justify-start" /></StaggerItem>
      </Stagger>

      <Stagger className="grid md:grid-cols-3 gap-6 mb-10" animateOnMount stagger={0.15} delay={0.3}>
        <StaggerItem className="bg-[#111111] border border-white/5 p-6 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em]">Profile</h3>
            {!editing && <motion.button whileHover={{ rotate: -12, scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setEditing(true)} className="text-white/60 hover:text-brand-gold"><Edit2 className="w-4 h-4" /></motion.button>}
          </div>
          <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div key="edit" className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <input className="luxury-input" value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} placeholder="Name" data-testid="prof-name" />
              <input className="luxury-input" value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} placeholder="Phone" data-testid="prof-phone" />
              <div className="flex gap-2">
                <button className="btn-gold !py-2 !px-4 !text-xs" onClick={() => saveMut.mutate()}>Save</button>
                <button className="btn-outline-gold !py-2 !px-4 !text-xs" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" className="space-y-2 text-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div><span className="text-white/40">Name: </span><span className="text-white">{user?.name}</span></div>
              <div><span className="text-white/40">Email: </span><span className="text-white">{user?.email}</span></div>
              <div><span className="text-white/40">Phone: </span><span className="text-white">{user?.phone || "—"}</span></div>
            </motion.div>
          )}
          </AnimatePresence>
        </StaggerItem>

        <StaggerItem className="md:col-span-2 bg-[#111111] border border-white/5 p-6">
          <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> My Appointments</h3>
          {appts.length === 0 ? (
            <div className="text-white/50 text-sm py-6 text-center">
              No appointments yet. <Link to="/contact" className="text-brand-gold underline">Book one</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appts.map((a, i) => (
                <motion.div
                  key={a.id}
                  layout
                  className="border border-white/10 hover:border-brand-gold/40 transition-colors p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  data-testid={`appt-${a.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.06, ease: EASE }}
                >
                  <div>
                    <div className="text-white font-playfair">{a.service}</div>
                    <div className="text-white/50 text-xs">{a.date} · {a.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.span
                      key={a.status}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 border ${STATUS_COLORS[a.status]}`}
                    >
                      {a.status}
                    </motion.span>
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <button onClick={() => cancelMut.mutate(a.id)} className="text-white/50 hover:text-red-400" title="Cancel" data-testid={`cancel-${a.id}`}>
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.5} className="inline-block" whileHover={{ scale: 1.04, transition: { duration: 0.2 } }} whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}>
        <Link to="/contact" className="btn-gold" data-testid="book-new"><Calendar className="w-4 h-4" /> Book New Appointment</Link>
      </Reveal>
    </div>
  );
}
