import { NextResponse } from "next/server";
import { sendRsvpEmail } from "@/lib/email-rsvp";

/**
 * API route to handle dinner RSVP submissions.
 *
 * Expects a JSON body with:
 *  - willAttend: boolean
 *  - diet: "veggie" | "fish"
 *  - intolerances: string
 *  - email?: string
 *
 * Returns a JSON object with success=true on success or an error message
 * otherwise. On submission, an email is sent to the TEAM_EMAIL address
 * configured for this deployment.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { willAttend, diet, intolerances, email } = body as {
      willAttend: boolean;
      diet: "veggie" | "fish";
      intolerances: string;
      email?: string;
    };

    // Basic validation
    if (typeof willAttend !== "boolean") {
      return NextResponse.json({ error: "Invalid willAttend" }, { status: 400 });
    }
    if (diet !== "veggie" && diet !== "fish") {
      return NextResponse.json({ error: "Invalid diet option" }, { status: 400 });
    }

    // Collect metadata (not all headers may be present in all deployments)
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;
    const submittedAt = new Date().toISOString();

    await sendRsvpEmail({
      willAttend,
      diet,
      intolerances: intolerances ?? "",
      email,
      meta: { submittedAt, ip, ua },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
