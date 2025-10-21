"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatShell from "@/components/chat/ChatShell";
import Bubble from "@/components/chat/Bubble";
import InputBar from "@/components/chat/InputBar";
import {
  steps,
  Answer,
  TranscriptEntry,
  getTotalRequiredSteps,
  getAnsweredRequiredCount,
  validateAnswers,
  Step,
} from "@/lib/convo";

const STORAGE_KEY = "amor-fati-chat-draft";

export default function ChatPage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isTyping]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Clear any existing conversation to start fresh
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setTranscript([]);
    setCurrentStepIndex(0);

    // Start fresh conversation
    setTimeout(() => showBotMessage(0), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft to localStorage on changes
  useEffect(() => {
    if (hasInitialized.current && currentStepIndex < steps.length) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, transcript, currentStepIndex })
      );
    }
  }, [answers, transcript, currentStepIndex]);

  const showBotMessage = (stepIndex: number) => {
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    if (step.role !== "bot" || !step.text) {
      // Skip to next step if this isn't a bot message
      setCurrentStepIndex(stepIndex + 1);
      setTimeout(() => showBotMessage(stepIndex + 1), 100);
      return;
    }

    setIsTyping(true);

    // Simulate typing delay
    const delay = Math.min(step.text.length * 20, 2000);
    setTimeout(() => {
      setIsTyping(false);
      setTranscript((prev) => [
        ...prev,
        { role: "bot", text: step.text!, step: step.id },
      ]);

      // Special handling for review step
      if (step.id === "review") {
        setIsReviewMode(true);
      }

      // Only move to next step if this bot message doesn't wait for continue
      if (!step.waitForContinue) {
        setCurrentStepIndex(stepIndex + 1);
      } else {
        // Stay at current step to show the continue button
        setCurrentStepIndex(stepIndex);
      }
    }, delay);
  };

  const handleUserResponse = (value: string) => {
    const step = steps[currentStepIndex];
    if (!step || step.role !== "user") return;

    // Parse value based on field type
    let parsedValue: any = value;
    if (step.field === "role") {
      const normalized = value.toLowerCase().trim();
      if (normalized !== "student" && normalized !== "leader") {
        setSubmitError("Please type 'student' or 'leader'");
        return;
      }
      parsedValue = normalized as "student" | "leader";
    } else if (step.field === "q3") {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 5) {
        setSubmitError("Please enter a number from 1 to 5");
        return;
      }
    }

    setSubmitError(null);

    // Save answer
    if (step.field) {
      setAnswers((prev) => ({ ...prev, [step.field!]: parsedValue }));
    }

    // Add to transcript
    setTranscript((prev) => [
      ...prev,
      { role: "user", text: value, step: step.id },
    ]);

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setTimeout(() => showBotMessage(nextIndex), 300);
  };

  const handleSkip = () => {
    const step = steps[currentStepIndex];
    if (!step || step.role !== "user" || step.required) return;

    // Add skip notation to transcript
    setTranscript((prev) => [
      ...prev,
      { role: "user", text: "(skipped)", step: step.id },
    ]);

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setTimeout(() => showBotMessage(nextIndex), 300);
  };

  const handleEdit = (field: keyof Answer) => {
    // Find the step index for this field
    const stepIndex = steps.findIndex((s) => s.field === field);
    if (stepIndex === -1) return;

    // Remove messages from that point forward
    const step = steps[stepIndex];
    const transcriptIndex = transcript.findIndex((t) => t.step === step.id);
    if (transcriptIndex !== -1) {
      setTranscript((prev) => prev.slice(0, transcriptIndex));
    }

    setIsReviewMode(false);
    setCurrentStepIndex(stepIndex);
  };

  const handleSubmit = async () => {
    // Validate
    const validation = validateAnswers(answers);
    if (!validation.valid) {
      setSubmitError(validation.errors.join(", "));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Show submit message
    const submitStep = steps.find((s) => s.id === "submit");
    if (submitStep?.text) {
      setTranscript((prev) => [
        ...prev,
        { role: "bot", text: submitStep.text!, step: "submit" },
      ]);
    }

    try {
      const res = await fetch("/api/submit-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          transcript,
          company: honeypot,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Submission failed";

        if (contentType && contentType.includes("application/json")) {
          try {
            const err = await res.json();
            errorMessage = err.error || errorMessage;
          } catch {
            errorMessage = `Server error (${res.status})`;
          }
        } else {
          errorMessage = `Server error (${res.status})`;
        }

        throw new Error(errorMessage);
      }

      // Clear draft
      localStorage.removeItem(STORAGE_KEY);

      // Show done message
      const doneStep = steps.find((s) => s.id === "done");
      if (doneStep?.text) {
        setTranscript((prev) => [
          ...prev,
          { role: "bot", text: doneStep.text!, step: "done" },
        ]);
      }

      // Redirect after a moment
      setTimeout(() => {
        router.push("/thanks");
      }, 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (confirm("Clear this conversation and start over?")) {
      localStorage.removeItem(STORAGE_KEY);
      setAnswers({});
      setTranscript([]);
      setCurrentStepIndex(0);
      setIsReviewMode(false);
      setSubmitError(null);
      setTimeout(() => showBotMessage(0), 500);
    }
  };

  const currentStep = steps[currentStepIndex];
  const isWaitingForUser =
    currentStep && currentStep.role === "user" && !isTyping && !isReviewMode;
  const canSkip = isWaitingForUser && !currentStep.required;

  const progress = {
    current: getAnsweredRequiredCount(answers),
    total: getTotalRequiredSteps(),
  };

  return (
    <ChatShell progress={progress} onClear={handleClear}>
      {/* Honeypot */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        aria-hidden="true"
        name="company"
      />

      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6" role="log">
          {transcript.map((msg, i) => (
            <Bubble key={i} role={msg.role} text={msg.text} />
          ))}
          {isTyping && <Bubble role="bot" text="" isTyping />}

          {/* Review mode */}
          {isReviewMode && (
            <div className="my-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-af-lilac/20">
              <h3 className="font-bold text-lg text-af-ink mb-4">
                Your Answers
              </h3>
              <div className="space-y-3">
                {Object.entries(answers).map(([key, value]) => {
                  if (value === undefined || value === "") return null;
                  const field = key as keyof Answer;
                  const label = getFieldLabel(field);

                  return (
                    <div
                      key={key}
                      className="flex justify-between items-start gap-3 p-3 rounded-xl bg-af-lilac/10"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-af-ink/70">
                          {label}
                        </p>
                        <p className="text-af-ink mt-1">
                          {typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : field === "role"
                              ? value === "student" 
                                ? "🎓 Student" 
                                : "✨ Leader"
                              : String(value)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEdit(field)}
                        className="text-sm px-3 py-1 rounded-lg bg-af-lilac/30 hover:bg-af-lilac/50 text-af-ink transition"
                        aria-label={`Edit ${label}`}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              {submitError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-4 bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-bold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Submit ✨"}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar or choice selector */}
        {isWaitingForUser && !isSubmitting && (
          <>
            {currentStep.field === "role" ? (
              <div className="border-t border-af-lilac/20 bg-white/80 backdrop-blur-sm p-4">
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleUserResponse("student")}
                    className="flex-1 max-w-xs px-6 py-4 rounded-xl bg-white border-2 border-af-lilac/30 hover:border-af-lilac hover:bg-af-lilac/10 text-af-ink font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    🎓 Student
                  </button>
                  <button
                    onClick={() => handleUserResponse("leader")}
                    className="flex-1 max-w-xs px-6 py-4 rounded-xl bg-white border-2 border-af-lilac/30 hover:border-af-lilac hover:bg-af-lilac/10 text-af-ink font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    ✨ Leader
                  </button>
                </div>
              </div>
            ) : currentStep.field === "q3" ? (
              <RatingSlider onSubmit={(value) => handleUserResponse(String(value))} />
            ) : (
              <InputBar
                onSend={handleUserResponse}
                onSkip={canSkip ? handleSkip : undefined}
                canSkip={canSkip}
                placeholder="Type your answer..."
                helper={currentStep.helper}
                inputType="text"
              />
            )}
          </>
        )}

        {/* Continue button for bot messages that wait for continue */}
        {currentStep && 
         currentStep.role === "bot" && 
         currentStep.waitForContinue && 
         !isTyping && 
         !isSubmitting && 
         transcript.length > 0 && // Only show after at least one message is in transcript
         transcript[transcript.length - 1]?.step === currentStep.id && // Only show if the last message is from this step
         (
          <div className="border-t border-af-lilac/20 bg-white/80 backdrop-blur-sm p-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const nextIndex = currentStepIndex + 1;
                  setCurrentStepIndex(nextIndex);
                  // Trigger the next bot message
                  setTimeout(() => showBotMessage(nextIndex), 100);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Ready! ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </ChatShell>
  );
}

function getFieldLabel(field: keyof Answer): string {
  const labels: Record<keyof Answer, string> = {
    role: "Role at Codam",
    q1: "First moment or feeling",
    q2: "Connection or story that stuck",
    q3: "Comfort rating (1-5)",
    q3_comment: "What made you feel that way",
    q4: "Did the evening change anything?",
    q5: "What would you love for next time?",
    q6: "What would you love this community to bring you — personally, professionally, or emotionally?",
    q7: "Final thoughts",
  };
  return labels[field] || field;
}

function RatingSlider({ onSubmit }: { onSubmit: (value: number) => void }) {
  const [value, setValue] = useState(3);

  const labels = [
    "Not really",
    "A bit",
    "Comfortable",
    "Very comfortable",
    "Completely at ease"
  ];

  return (
    <div className="border-t border-af-lilac/20 bg-white/80 backdrop-blur-sm p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-af-ink/60">1</span>
          <span className="text-xl font-bold text-af-ink">{value}</span>
          <span className="text-sm text-af-ink/60">5</span>
        </div>
        
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-af-lilac/20 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, rgb(219, 39, 119) 0%, rgb(147, 51, 234) ${((value - 1) / 4) * 100}%, rgb(243, 232, 255) ${((value - 1) / 4) * 100}%, rgb(243, 232, 255) 100%)`
          }}
        />
        
        <div className="text-center mt-3 mb-4">
          <span className="text-sm font-medium text-af-ink/70">{labels[value - 1]}</span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onSubmit(value)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Continue ✨
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid rgb(147, 51, 234);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid rgb(147, 51, 234);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

