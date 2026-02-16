import { NextResponse } from "next/server";
import { sendRsvpEmail } from "@/lib/email-rsvp";
import { resolveRsvpToken } from "@/lib/rsvp-token";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * API route to handle dinner RSVP submissions.
 *
 * Expects a JSON body with:
 *  - willAttend: boolean
 *  - diet: "veggie" | "fish"
 *  - intolerances: string
 *  - token?: string
 *  - email?: string (legacy fallback)
 *  - name?: string
 *
 * Returns a JSON object with success=true on success or an error message
 * otherwise. On submission, an email is sent to the TEAM_EMAIL address
 * configured for this deployment.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { willAttend, diet, intolerances, token, email, name } = body as {
      willAttend: boolean;
      diet: "veggie" | "fish";
      intolerances: string;
      token?: string;
      email?: string;
      name?: string;
    };

    // Basic validation
    if (typeof willAttend !== "boolean") {
      return NextResponse.json({ error: "Invalid willAttend" }, { status: 400 });
    }
    if (diet !== "veggie" && diet !== "fish") {
      return NextResponse.json({ error: "Invalid diet option" }, { status: 400 });
    }

    const trimmedToken = typeof token === "string" ? token.trim() : "";
    const fallbackEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (normalizedName.length > 120) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    let resolvedEmail = fallbackEmail;
    if (trimmedToken) {
      try {
        resolvedEmail = resolveRsvpToken(trimmedToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid RSVP token";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else if (!isValidEmail(fallbackEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "Missing RSVP identity token" },
        { status: 400 }
      );
    }

    // Collect metadata (not all headers may be present in all deployments)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;
    const submittedAt = new Date().toISOString();

    await sendRsvpEmail({
      willAttend,
      diet,
      intolerances: intolerances ?? "",
      email: resolvedEmail,
      name: normalizedName || undefined,
      meta: { submittedAt, ip, ua },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
