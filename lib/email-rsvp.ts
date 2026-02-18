import { Resend } from "resend";

type AttendanceChoice = "panel" | "diner" | "none";

/**
 * Send an RSVP notification email to the team.
 *
 * This helper uses the Resend API (https://resend.com/) to send a simple
 * message summarising a guest's RSVP for an Amor Fati dinner. The
 * environment variables RESEND_API_KEY, TEAM_EMAIL and FROM_EMAIL must be
 * configured in your deployment for this to work.
 */
export async function sendRsvpEmail(data: {
  attendanceChoices: AttendanceChoice[];
  diet: "meat" | "vegetarian" | "fish";
  intolerances: string;
  /** Optional name of the respondent, if available */
  name?: string;
  /** Optional 42 intra of the respondent, if available */
  intra?: string;
  /** Optional email of the respondent, if available */
  email?: string;
  meta: { submittedAt: string; ip?: string | null; ua?: string | null };
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const to = process.env.TEAM_EMAIL!;
  const from = process.env.FROM_EMAIL!;

  const { attendanceChoices, diet, intolerances, name, intra, email, meta } = data;
  const attendanceLabels: Record<AttendanceChoice, string> = {
    panel: "The International Women's Day Panel",
    diner: "The Diner",
    none: "None",
  };
  const dietLabels: Record<"meat" | "vegetarian" | "fish", string> = {
    meat: "Meat - Slow cooked top-side beef",
    vegetarian: "Vegetarian - Hispi Cabbage",
    fish: "Fish - Plaice Fillet",
  };
  const attendText =
    attendanceChoices.map((choice) => attendanceLabels[choice]).join(", ") || "-";
  const dietText = dietLabels[diet];
  const subject = attendanceChoices.includes("none")
    ? "Amor Fati RSVP – Not attending"
    : "Amor Fati RSVP – Attendance update";

  const html = `
    <div style="font-family:Inter,system-ui">
      <h2>New Amor Fati dinner RSVP</h2>
      <p><b>SubmittedAt:</b> ${meta.submittedAt}<br/>
         <b>IP:</b> ${meta.ip ?? "-"}<br/>
         <b>UA:</b> ${meta.ua ?? "-"}</p>
      <hr/>
      ${intra ? `<p><b>42 intra:</b> ${intra}</p>` : ""}
      ${name ? `<p><b>Name:</b> ${name}</p>` : ""}
      <p><b>Attendance:</b> ${attendText}</p>
      <p><b>Menu:</b> ${dietText}</p>
      <p><b>Intolerances:</b> ${intolerances || "-"}</p>
      ${email ? `<p><b>Email:</b> ${email}</p>` : ""}
    </div>`;

  const text = [
    "New Amor Fati dinner RSVP",
    `SubmittedAt: ${meta.submittedAt}`,
    `IP: ${meta.ip ?? "-"}`,
    `UA: ${meta.ua ?? "-"}`,
    "",
    intra ? `42 intra: ${intra}` : undefined,
    name ? `Name: ${name}` : undefined,
    `Attendance choices: ${attendText}`,
    `Menu: ${dietText}`,
    `Intolerances: ${intolerances || "-"}`,
    email ? `Email: ${email}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
}
