import { Resend } from "resend";

export async function sendChatEmail(data: {
  answers: {
    role: "student" | "leader";
    q1: number;
    q2?: string;
    q3: string;
    q4: string;
    q5: string;
    q6: string;
    q7?: string;
  };
  transcript: { role: "bot" | "user"; text: string; step?: string }[];
  meta: { submittedAt: string; ip?: string; ua?: string; origin?: string };
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const to = process.env.TEAM_EMAIL!;
  const from = process.env.FROM_EMAIL!;
  const safe = (s: string) =>
    (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const htmlTranscript = data.transcript
    .map(
      (m) =>
        `<p><b>${m.role === "bot" ? "Companion" : "You"}:</b> ${safe(m.text).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  const a = data.answers;
  const html = `
  <div style="font-family:Inter,system-ui">
    <h2>New Amor Fati conversational submission</h2>
    <p><b>SubmittedAt:</b> ${data.meta.submittedAt}<br/>
       <b>IP:</b> ${data.meta.ip ?? "-"}<br/>
       <b>UA:</b> ${data.meta.ua ?? "-"}</p>
    <hr/>
    <h3>Chat Transcript</h3>
    ${htmlTranscript}
  </div>`;

  const text = [
    "New Amor Fati conversational submission",
    `SubmittedAt: ${data.meta.submittedAt}`,
    `IP: ${data.meta.ip ?? "-"}`,
    `UA: ${data.meta.ua ?? "-"}`,
    "",
    "Chat Transcript:",
    ...data.transcript.map(
      (m) => `${m.role === "bot" ? "Companion" : "You"}: ${m.text}`
    ),
  ].join("\n");

  return resend.emails.send({
    from,
    to,
    subject: "Amor Fati, new chat submission",
    html,
    text,
  });
}

