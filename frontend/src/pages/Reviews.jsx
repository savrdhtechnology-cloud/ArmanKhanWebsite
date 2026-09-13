import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "@/lib/api";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {reviews.map((r) => (
            <div key={r.id} className="bg-[#111111] border border-white/5 p-8" data-testid={`review-card-${r.id}`}>
              <div className="flex gap-1 mb-3 text-brand-gold">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-brand-gold" />)}
              </div>
              <p className="text-white/70 italic mb-4 font-playfair text-lg leading-relaxed">"{r.comment}"</p>
              <div className="text-brand-gold text-xs uppercase tracking-[0.25em]">— {r.name}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#111111] border border-brand-gold/30 p-8 max-w-2xl mx-auto">
          <h3 className="font-playfair text-2xl text-white mb-4">Share Your Experience</h3>
          {!user ? (
            <p className="text-white/60"><Link to="/login" className="text-brand-gold underline">Login</Link> to post a review.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} data-testid={`star-${n}`}>
                    <Star className={`w-6 h-6 ${n <= rating ? "text-brand-gold fill-brand-gold" : "text-white/20"}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="luxury-input min-h-[100px] mb-4"
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                data-testid="review-comment"
              />
              <button className="btn-gold" onClick={() => mut.mutate()} disabled={!comment.trim() || mut.isPending} data-testid="submit-review">
                {mut.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
