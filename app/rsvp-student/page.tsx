"use client";

import { useState } from "react";

type AttendanceChoice = "diner" | "none";
type ProfessionalStatus = "developer" | "internship" | "none";

/**
 * Student RSVP page for Amor Fati dinner.
 *
 * This page mirrors the RSVP form and collects student-specific details.
 */
export default function RsvpStudentPage() {
  const [diet, setDiet] = useState<"meat" | "vegetarian" | "fish">("meat");
  const [intolerances, setIntolerances] = useState("");
  const [intra, setIntra] = useState("");
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState("");
  const [professionalStatus, setProfessionalStatus] =
    useState<ProfessionalStatus | "">("");
  const [professionalDuration, setProfessionalDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedIntra = intra.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedProfessionalDuration = professionalDuration.trim();

    if (!trimmedIntra) {
      setError("Please enter your 42 intra");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!cohort) {
      setError("Please select your cohort");
      return;
    }

    if (!professionalStatus) {
      setError("Please select your professional status");
      return;
    }

    if (
      (professionalStatus === "developer" ||
        professionalStatus === "internship") &&
      !trimmedProfessionalDuration
    ) {
      setError("Please tell us since how long");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceChoices: ["diner"],
          diet,
          intolerances,
          intra: trimmedIntra,
          email: trimmedEmail,
          cohort,
          professionalStatus,
          professionalDuration: trimmedProfessionalDuration || undefined,
        }),
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
          RSVP for Amor Fati Dinner (Students)
        </h1>

        <div className="mb-6 rounded-xl border border-af-lilac/30 bg-af-lilac/10 p-4 text-af-ink">
          <p className="mb-1">📍 Kanteen25, Amsterdam</p>
          <p className="mb-1">📅 March 11, 2026</p>
          <p>🕔 19:30 – 21:00</p>
        </div>

        <div className="mb-6 rounded-xl border border-af-lilac/20 bg-white p-3 text-sm text-af-ink/90">
          Please fill your 42 intra and email to submit your RSVP.
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">42 intra</p>
          <input
            type="text"
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            placeholder="your Codam intra (e.g. jdoe)"
            value={intra}
            onChange={(e) => setIntra(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Your email</p>
          <input
            type="email"
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Cohort</p>
          <select
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
          >
            <option value="">Select your cohort</option>
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Professional status</p>
          <select
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            value={professionalStatus}
            onChange={(e) => setProfessionalStatus(e.target.value as ProfessionalStatus | "")}
          >
            <option value="">Select one</option>
            <option value="developer">I already work as a developer</option>
            <option value="internship">I started an internship</option>
            <option value="none">Not yet</option>
          </select>
        </div>

        {(professionalStatus === "developer" ||
          professionalStatus === "internship") && (
          <div className="mb-6">
            <p className="font-medium text-af-ink mb-2">Since how long?</p>
            <input
              type="text"
              className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
              placeholder="e.g. 6 months"
              value={professionalDuration}
              onChange={(e) => setProfessionalDuration(e.target.value)}
            />
          </div>
        )}

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Menu preference</p>
          <select
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            value={diet}
            onChange={(e) => setDiet(e.target.value as "meat" | "vegetarian" | "fish")}
          >
            <option value="meat">Meat - Slow cooked top-side beef</option>
            <option value="vegetarian">Vegetarian - Hispi Cabbage</option>
            <option value="fish">Fish - Plaice Fillet</option>
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
