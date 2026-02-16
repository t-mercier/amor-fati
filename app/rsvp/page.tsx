"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * RSVP page for Amor Fati dinner.
 *
 * This page presents a simple form to confirm attendance, choose a diet
 * preference, and list any dietary intolerances. When the form is
 * submitted, it POSTs to the `/api/submit-rsvp` endpoint and displays
 * a confirmation or error message. Styling follows the existing
 * Amor Fati look and feel using CSS utility classes.
 */
export default function RsvpPage() {
  const [willAttend, setWillAttend] = useState<boolean | null>(null);
  const [diet, setDiet] = useState<"veggie" | "fish">("veggie");
  const [intolerances, setIntolerances] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  // Read email from query parameter if provided
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") ?? "";
  const [email] = useState(defaultEmail);

  const handleSubmit = async (e: React.FormEvent) => {
  
    e.preventDefault();
    if (willAttend === null) {
      setError("Please indicate whether you will be there or not");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ willAttend, diet, intolerances, email }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Submission failed");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-af-lilac/10 p-6">
        <div className="max-w-lg w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-af-lilac/20 text-center">
          <h1 className="text-2xl font-bold mb-4 text-af-ink">Thank you!</h1>
          <p className="text-af-ink mb-6">
            Your RSVP has been recorded. You can close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-af-lilac/10 p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-lg w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-af-lilac/20"
      >
        <h1 className="text-2xl font-bold mb-6 text-af-ink">
          RSVP for Amor Fati Dinner
        </h1>

        {/* Email field (read-only) */}
        {email && (
          <div className="mb-6">
            <p className="font-medium text-af-ink mb-2">Email</p>
            <input
              type="text"
              className="w-full p-3 rounded-lg border border-af-lilac/30 bg-gray-50 text-af-ink"
              value={email}
              readOnly
            />
          </div>
        )}

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Will you be there?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="willAttend"
                value="yes"
                checked={willAttend === true}
                onChange={() => setWillAttend(true)}
                className="h-5 w-5 text-af-lilac focus:ring-af-lilac border-af-lilac/30"
              />
              <span className="text-af-ink">I will be there</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="willAttend"
                value="no"
                checked={willAttend === false}
                onChange={() => setWillAttend(false)}
                className="h-5 w-5 text-af-lilac focus:ring-af-lilac border-af-lilac/30"
              />
              <span className="text-af-ink">I will not be there</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Diet preference</p>
          <select
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            value={diet}
            onChange={(e) =>
              setDiet(e.target.value as "veggie" | "fish")
            }
          >
            <option value="veggie">Veggie</option>
            <option value="fish">Fish</option>
          </select>
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Intolerances or allergies</p>
          <textarea
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            rows={4}
            placeholder="Let us know about any food intolerances or allergies"
            value={intolerances}
            onChange={(e) => setIntolerances(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Submit ✨"}
        </button>
      </form>
    </div>
  );
}
