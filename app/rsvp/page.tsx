"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type AttendanceChoice = "panel" | "diner" | "none";

/**
 * RSVP page for Amor Fati dinner.
 *
 * This page presents a simple form to confirm attendance, choose a diet
 * preference, and list any dietary intolerances. When the form is
 * submitted, it POSTs to the `/api/submit-rsvp` endpoint and displays
 * a confirmation or error message. Styling follows the existing
 * Amor Fati look and feel using CSS utility classes.
 */
function RsvpPageContent() {
  const [attendanceChoices, setAttendanceChoices] = useState<AttendanceChoice[]>(
    []
  );
  const [diet, setDiet] = useState<"veggie" | "fish">("veggie");
  const [intolerances, setIntolerances] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";
  const legacyEmail = searchParams.get("email") ?? "";
  const hasToken = Boolean(token);

  const toggleAttendanceChoice = (choice: AttendanceChoice) => {
    setAttendanceChoices((previous) => {
      if (choice === "none") {
        return previous.includes("none") ? [] : ["none"];
      }

      const withoutNone = previous.filter((item) => item !== "none");
      if (withoutNone.includes(choice)) {
        return withoutNone.filter((item) => item !== choice);
      }

      if (withoutNone.length >= 2) {
        return withoutNone;
      }

      return [...withoutNone, choice];
    });
  };

  const isChoiceDisabled = (choice: AttendanceChoice): boolean => {
    if (choice === "none") {
      return attendanceChoices.length === 2;
    }

    if (attendanceChoices.includes("none")) {
      return true;
    }

    return (
      attendanceChoices.length >= 2 && !attendanceChoices.includes(choice)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (attendanceChoices.length === 0) {
      setError("Please select at least one attendance option");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceChoices,
          diet,
          intolerances,
          token,
          email: hasToken ? legacyEmail : undefined,
          name: trimmedName || undefined,
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
          RSVP for Amor Fati Dinner
        </h1>

        <div className="mb-6 rounded-xl border border-af-lilac/30 bg-af-lilac/10 p-4 text-af-ink">
          <p className="mb-1">📍 Kanteen25, Amsterdam</p>
          <p className="mb-1">📅 March 11, 2026</p>
          <p>🕔 19:30 – 21:00</p>
        </div>

        {hasToken ? (
          <div className="mb-6 rounded-xl border border-af-lilac/20 bg-white p-3 text-sm text-af-ink/90">
            This RSVP link is personal. Your email is attached automatically.
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-af-lilac/20 bg-white p-3 text-sm text-af-ink/90">
            Please fill your name to submit your RSVP.
          </div>
        )}

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Your name</p>
          <input
            type="text"
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            placeholder="First and last name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">I will attend:</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="attendance-panel"
                value="panel"
                checked={attendanceChoices.includes("panel")}
                onChange={() => toggleAttendanceChoice("panel")}
                disabled={isChoiceDisabled("panel")}
                className="h-5 w-5 text-af-lilac focus:ring-af-lilac border-af-lilac/30"
              />
              <span className="text-af-ink">
                The International Women&apos;s Day Panel
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="attendance-diner"
                value="diner"
                checked={attendanceChoices.includes("diner")}
                onChange={() => toggleAttendanceChoice("diner")}
                disabled={isChoiceDisabled("diner")}
                className="h-5 w-5 text-af-lilac focus:ring-af-lilac border-af-lilac/30"
              />
              <span className="text-af-ink">The Diner</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="attendance-none"
                value="none"
                checked={attendanceChoices.includes("none")}
                onChange={() => toggleAttendanceChoice("none")}
                disabled={isChoiceDisabled("none")}
                className="h-5 w-5 text-af-lilac focus:ring-af-lilac border-af-lilac/30"
              />
              <span className="text-af-ink">None</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-af-ink/70">You can select up to 2 options.</p>
        </div>

        <div className="mb-6">
          <p className="font-medium text-af-ink mb-2">Diet preference</p>
          <select
            className="w-full p-3 rounded-lg border border-af-lilac/30 bg-white text-af-ink"
            value={diet}
            onChange={(e) => setDiet(e.target.value as "veggie" | "fish")}
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

export default function RsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-af-lilac/10 p-6">
          <div className="max-w-lg w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-af-lilac/20 text-center">
            <p className="text-af-ink">Loading RSVP form...</p>
          </div>
        </div>
      }
    >
      <RsvpPageContent />
    </Suspense>
  );
}
