import { Resend } from "resend";

/**
 * Send an RSVP notification email to the team.
 *
 * This helper uses the Resend API (https://resend.com/) to send a simple
 * message summarising a guest's RSVP for an Amor Fati dinner. The
 * environment variables RESEND_API_KEY, TEAM_EMAIL and FROM_EMAIL must be
 * configured in your deployment for this to work.
 */
export async function sendRsvpEmail(data: {
  willAttend: boolean;
  diet: "veggie" | "fish";
  intolerances: string;
  /** Optional name of the respondent, if available */
  name?: string;
  /** Optional email of the respondent, if available */
  email?: string;
  meta: { submittedAt: string; ip?: string | null; ua?: string | null };
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const to = process.env.TEAM_EMAIL!;
  const from = process.env.FROM_EMAIL!;

  const { willAttend, diet, intolerances, name, email, meta } = data;
  const subject = willAttend
    ? "Amor Fati RSVP – Coming to dinner"
    : "Amor Fati RSVP – Not attending";
  const attendText = willAttend ? "will be there" : "will not be there";

  const html = `
    <div style="font-family:Inter,system-ui">
      <h2>New Amor Fati dinner RSVP</h2>
      <p><b>SubmittedAt:</b> ${meta.submittedAt}<br/>
         <b>IP:</b> ${meta.ip ?? "-"}<br/>
         <b>UA:</b> ${meta.ua ?? "-"}</p>
      <hr/>
      ${name ? `<p><b>Name:</b> ${name}</p>` : ""}
      <p><b>Attendance:</b> ${attendText}</p>
      <p><b>Diet:</b> ${diet}</p>
      <p><b>Intolerances:</b> ${intolerances || "-"}</p>
      ${email ? `<p><b>Email:</b> ${email}</p>` : ""}
    </div>`;

  const text = [
    "New Amor Fati dinner RSVP",
    `SubmittedAt: ${meta.submittedAt}`,
    `IP: ${meta.ip ?? "-"}`,
    `UA: ${meta.ua ?? "-"}`,
    "",
    name ? `Name: ${name}` : undefined,
    `Attendance: ${attendText}`,
    `Diet: ${diet}`,
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
