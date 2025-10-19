export type StepId =
  | "intro"
  | "role_select"
  | "q1" | "q2"
  | "q3" | "q3_comment"
  | "q4" | "q5" | "q6"
  | "consent"
  | "review"
  | "submit"
  | "done";

export type Answer = {
  role?: "student" | "leader";
  q1?: string;
  q2?: string;
  q3?: number; // 1..5
  q3_comment?: string;
  q4?: string;
  q5?: string;
  q6?: string;
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

This is a light chat to look back on the dinner, what you felt, what you noticed, what you'd love for the future.
Take your time; there's no right or wrong answer. Ready?`,
    waitForContinue: true,
  },
  {
    id: "role_select",
    role: "bot",
    text: "First, are you a student or a leader?",
  },
  {
    id: "role_select",
    role: "user",
    required: true,
    field: "role",
    helper: "Type 'student' or 'leader'",
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
    text: "Was there someone or something that really stuck with you, maybe a conversation, a vibe, or a story that left a mark?",
  },
  { id: "q2", role: "user", required: true, field: "q2" },

  {
    id: "q3",
    role: "bot",
    text: "How did you feel in the space, the energy, the atmosphere, the people?\n\nIf you had to rate how comfortable you felt, from 1 (not really) to 5 (completely at ease), what would you say?",
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
    text: "Did the evening change anything in how you see yourself, your journey, or the kind of community you want around you?",
  },
  { id: "q4", role: "user", required: true, field: "q4" },

  {
    id: "q5",
    role: "bot",
    text: "If we organize another Amor Fati gathering, what kind of experience would you love next?\n\n(Could be another dinner, a workshop, a walk, something creative, anything you'd enjoy!)",
  },
  { id: "q5", role: "user", required: true, field: "q5" },

  {
    id: "q6",
    role: "bot",
    text: "Before we close, is there anything else you'd like to share, a wish, an idea, or just a last feeling about the evening?",
  },
  { id: "q6", role: "user", field: "q6" },

  {
    id: "consent",
    role: "bot",
    text: "Do you consent to your answers being used (confidentially) to help us improve future Amor Fati gatherings?",
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
  if (answers.role) count++;
  if (answers.q1) count++;
  if (answers.q2) count++;
  if (answers.q3) count++;
  if (answers.q4) count++;
  if (answers.q5) count++;
  if (answers.consent) count++;
  return count;
}

// Validate all required fields are present
export function validateAnswers(answers: Answer): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!answers.role || (answers.role !== "student" && answers.role !== "leader"))
    errors.push("Role selection is required");
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
  if (answers.consent !== true) errors.push("Consent is required");

  return { valid: errors.length === 0, errors };
}

