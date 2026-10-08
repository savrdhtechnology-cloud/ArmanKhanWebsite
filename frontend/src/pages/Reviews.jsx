import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Reveal, Stagger, StaggerItem, EASE } from "@/components/Motion";

export default function Reviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => (await api.get("/reviews")).data,
  });

  const mut = useMutation({
    mutationFn: async () => (await api.post("/reviews", { rating, comment })).data,
    onSuccess: () => {
      setComment(""); setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Thanks for your review!");
    },
    onError: (e) => toast.error(formatError(e.response?.data?.detail)),
  });

  return (
    <div data-testid="reviews-page">
      <section className="py-16 max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Testimonials</SectionLabel>
          <SectionTitle>Client <span className="text-brand-gold italic">Reviews</span></SectionTitle>
          <Divider />
        </div>

        {/* Re-keyed on length so newly loaded / posted reviews animate in too */}
        <Stagger key={reviews.length} className="grid md:grid-cols-2 gap-6 mb-16" stagger={0.1} amount={0.05}>
          {reviews.map((r) => (
            <StaggerItem
              key={r.id}
              className="bg-[#111111] border border-white/5 hover:border-brand-gold/40 transition-colors duration-500 p-8"
              data-testid={`review-card-${r.id}`}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: EASE } }}
            >
              <div className="flex gap-1 mb-3 text-brand-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 + i * 0.07 }}
                  >
                    <Star className="w-4 h-4 fill-brand-gold" />
                  </motion.span>
                ))}
              </div>
              <p className="text-white/70 italic mb-4 font-playfair text-lg leading-relaxed">"{r.comment}"</p>
              <div className="text-brand-gold text-xs uppercase tracking-[0.25em]">— {r.name}</div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal direction="scale" className="bg-[#111111] border border-brand-gold/30 p-8 max-w-2xl mx-auto">
          <h3 className="font-playfair text-2xl text-white mb-4">Share Your Experience</h3>
          {!user ? (
            <p className="text-white/60"><Link to="/login" className="text-brand-gold underline">Login</Link> to post a review.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    onClick={() => setRating(n)}
                    data-testid={`star-${n}`}
                    whileHover={{ scale: 1.25, rotate: 12 }}
                    whileTap={{ scale: 0.85 }}
                    animate={n <= rating ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Star className={`w-6 h-6 transition-colors ${n <= rating ? "text-brand-gold fill-brand-gold" : "text-white/20"}`} />
                  </motion.button>
                ))}
              </div>
              <textarea
                className="luxury-input min-h-[100px] mb-4"
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                data-testid="review-comment"
              />
              <motion.button
                className="btn-gold"
                onClick={() => mut.mutate()}
                disabled={!comment.trim() || mut.isPending}
                data-testid="submit-review"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                {mut.isPending ? "Submitting..." : "Submit Review"}
              </motion.button>
            </>
          )}
        </Reveal>
      </section>
    </div>
  );
}
