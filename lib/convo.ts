export type StepId =
  | "intro"
  | "q1" | "q2"
  | "q3" | "q3_comment"
  | "q4" | "q5" | "q6" | "q7" | "q8"
  | "q9" | "q10"
  | "consent"
  | "review"
  | "submit"
  | "done";

export type Answer = {
  q1?: string;
  q2?: string;
  q3?: number; // 1..5
  q3_comment?: string;
  q4?: string;
  q5?: string;
  q6?: string;
  q7?: string;
  q8?: string;
  q9?: string;
  q9_name_contact?: string;
  consent?: boolean; // required at submit
};

export interface Step {
  id: StepId;
  role: "bot" | "user";
  text?: string;
  required?: boolean;
  helper?: string;
  field?: keyof Answer; // maps user step to answer field
  waitForContinue?: boolean; // Add this for steps that need a continue button
}

export const steps: Step[] = [
  {
    id: "intro",
    role: "bot",
    text: `Hi! I'm your Amor Fati companion 🌷

This is just a light chat to look back on the dinner — what you felt, what you noticed, what you'd love next.
Take your time, there's no rush, and you can skip any question if it doesn't click.
Ready to start?`,
    waitForContinue: true,
  },
  {
    id: "q1",
    role: "bot",
    text: "When you think back to the evening, what moment or feeling comes to mind first?",
  },
  { id: "q1", role: "user", required: true, field: "q1" },

  {
    id: "q2",
    role: "bot",
    text: "Was there someone or something that really stuck with you — maybe a conversation, a vibe, or a story?",
  },
  { id: "q2", role: "user", required: true, field: "q2" },

  {
    id: "q3",
    role: "bot",
    text: "How did you feel in the space itself — the atmosphere, the energy, the people around you?\n\nIf you had to rate how comfortable you felt, from 1 (not really) to 5 (completely at ease), what would you say?",
  },
  {
    id: "q3",
    role: "user",
    required: true,
    field: "q3",
    helper: "Enter a number from 1 to 5",
  },

  {
    id: "q3_comment",
    role: "bot",
    text: "What made you feel that way?",
  },
  { id: "q3_comment", role: "user", field: "q3_comment" },

  {
    id: "q4",
    role: "bot",
    text: "Did the evening change anything in how you see yourself, your path, or maybe the kind of community you want around you?",
  },
  { id: "q4", role: "user", required: true, field: "q4" },

  {
    id: "q5",
    role: "bot",
    text: "Was there something that inspired you or made you think differently — a story, a piece of advice, or just a feeling?",
  },
  { id: "q5", role: "user", required: true, field: "q5" },

  {
    id: "q6",
    role: "bot",
    text: "If we were to organize another Amor Fati gathering, what kind of experience would you love?\n\n(Could be another dinner, a workshop, a walk, something creative — anything that comes to mind!)",
  },
  { id: "q6", role: "user", required: true, field: "q6" },

  {
    id: "q7",
    role: "bot",
    text: "What should we absolutely keep from this first edition — the part you'd want to experience again next time?",
  },
  { id: "q7", role: "user", required: true, field: "q7" },

  {
    id: "q8",
    role: "bot",
    text: "Is there anything you'd tweak or improve for next time?",
  },
  { id: "q8", role: "user", field: "q8" },

  {
    id: "q9",
    role: "bot",
    text: "Before we wrap up, is there anything else you'd like to share — a feeling, an idea, or just a little note?",
  },
  { id: "q9", role: "user", field: "q9" },

  {
    id: "q10",
    role: "bot",
    text: "If you'd like to stay involved or help shape future Amor Fati events, you can leave your name or LinkedIn here 💌",
  },
  { id: "q10", role: "user", field: "q9_name_contact" },

  {
    id: "consent",
    role: "bot",
    text: "One last thing — do you consent to your answers being used (confidentially) to help us improve and design future Amor Fati gatherings?",
  },
  {
    id: "consent",
    role: "user",
    required: true,
    field: "consent",
    helper: "Type 'yes' to consent",
  },

  {
    id: "review",
    role: "bot",
    text: "Here's a quick preview of what you've shared. You can edit any answer below, then press Submit when ready.",
  },

  { id: "submit", role: "bot", text: "Sending now… ✨" },
  {
    id: "done",
    role: "bot",
    text: `Thank you for your honesty and presence 💫
This sisterhood grows through every story shared, every idea voiced, and every connection made.`,
  },
];

export interface TranscriptEntry {
  role: "bot" | "user";
  text: string;
  step?: StepId;
}

// Helper to count total required questions
export function getTotalRequiredSteps(): number {
  return steps.filter((s) => s.role === "user" && s.required).length;
}

// Helper to count answered required questions
export function getAnsweredRequiredCount(answers: Answer): number {
  let count = 0;
  if (answers.q1) count++;
  if (answers.q2) count++;
  if (answers.q3) count++;
  if (answers.q4) count++;
  if (answers.q5) count++;
  if (answers.q6) count++;
  if (answers.q7) count++;
  if (answers.q8) count++;
  if (answers.consent) count++;
  return count;
}

// Validate all required fields are present
export function validateAnswers(answers: Answer): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!answers.q1 || answers.q1.trim().length === 0)
    errors.push("Q1 is required");
  if (!answers.q2 || answers.q2.trim().length === 0)
    errors.push("Q2 is required");
  if (
    answers.q3 === undefined ||
    !Number.isInteger(answers.q3) ||
    answers.q3 < 1 ||
    answers.q3 > 5
  )
    errors.push("Q3 must be a number from 1 to 5");
  if (!answers.q4 || answers.q4.trim().length === 0)
    errors.push("Q4 is required");
  if (!answers.q5 || answers.q5.trim().length === 0)
    errors.push("Q5 is required");
  if (!answers.q6 || answers.q6.trim().length === 0)
    errors.push("Q6 is required");
  if (!answers.q7 || answers.q7.trim().length === 0)
    errors.push("Q7 is required");
  if (!answers.q8 || answers.q8.trim().length === 0)
    errors.push("Q8 is required");
  if (answers.consent !== true) errors.push("Consent is required");

  return { valid: errors.length === 0, errors };
}

