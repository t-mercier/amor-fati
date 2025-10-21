export type StepId =
  | "intro"
  | "role_select"
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7"
  | "review"
  | "submit"
  | "done";

export type Answer = {
  role?: "student" | "leader";
  q1?: number; // 1..5 comfort rating
  q2?: string; // what made you feel that way
  q3?: string; // connection that stuck
  q4?: string; // did it change anything
  q5?: string; // community expectations
  q6?: string; // future gatherings
  q7?: string; // final thoughts
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
Take your time; there's no right or wrong answer, and it is completely anonymous. Ready?`,
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
    text: "How did you feel in the space, the energy, the atmosphere, the people?\nIf you had to rate how comfortable you felt, from 1 (not really) to 5 (completely at ease), what would you say?",
  },
  {
    id: "q1",
    role: "user",
    required: true,
    field: "q1",
    helper: "Enter a number from 1 to 5",
  },

  {
    id: "q2",
    role: "bot",
    text: "What made you feel that way?",
  },
  { id: "q2", role: "user", field: "q2" },

  {
    id: "q3",
    role: "bot",
    text: "Was there someone or something that really stuck with you, maybe a conversation, a vibe, or a story that left a mark?",
  },
  { id: "q3", role: "user", required: true, field: "q3" },

  {
    id: "q4",
    role: "bot",
    text: "Did the evening change anything in how you see yourself, your journey, or the kind of community you want around you?",
  },
  { id: "q4", role: "user", required: true, field: "q4" },

  {
    id: "q5",
    role: "bot",
    text: "What do you hope to get out of being part of this community? (How do you imagine this community could support or inspire you moving forward?)",
  },
  { id: "q5", role: "user", required: true, field: "q5" },

  {
    id: "q6",
    role: "bot",
    text: "If we organize another Amor Fati gathering, what kind of experience would you love next?\n(A dinner, a workshop, a walk, anything you'd enjoy!)",
  },
  { id: "q6", role: "user", required: true, field: "q6" },

  {
    id: "q7",
    role: "bot",
    text: "Before we close, is there anything else you'd like to share, a wish, an idea, or just a last feeling about the evening?",
  },
  { id: "q7", role: "user", field: "q7" },

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
  if (answers.q1 !== undefined) count++;
  if (answers.q3) count++;
  if (answers.q4) count++;
  if (answers.q5) count++;
  if (answers.q6) count++;
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
  if (
    answers.q1 === undefined ||
    !Number.isInteger(answers.q1) ||
    answers.q1 < 1 ||
    answers.q1 > 5
  )
    errors.push("Q1 must be a number from 1 to 5");
  if (!answers.q3 || answers.q3.trim().length === 0)
    errors.push("Q3 is required");
  if (!answers.q4 || answers.q4.trim().length === 0)
    errors.push("Q4 is required");
  if (!answers.q5 || answers.q5.trim().length === 0)
    errors.push("Q5 is required");
  if (!answers.q6 || answers.q6.trim().length === 0)
    errors.push("Q6 is required");

  return { valid: errors.length === 0, errors };
}

