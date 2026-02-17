import { NextResponse } from "next/server";
import { sendRsvpEmail } from "@/lib/email-rsvp";
import { resolveRsvpToken } from "@/lib/rsvp-token";

type AttendanceChoice = "panel" | "diner" | "none";

/**
 * API route to handle dinner RSVP submissions.
 *
 * Expects a JSON body with:
 *  - attendanceChoices: ("panel" | "diner" | "none")[]
 *  - diet: "meat" | "vegetarian" | "fish"
 *  - intolerances: string
 *  - token?: string
 *  - email?: string
 *  - name?: string
 *
 * Returns a JSON object with success=true on success or an error message
 * otherwise. On submission, an email is sent to the TEAM_EMAIL address
 * configured for this deployment.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attendanceChoices, diet, intolerances, token, email, name } = body as {
      attendanceChoices: unknown;
      diet: "meat" | "vegetarian" | "fish";
      intolerances: string;
      token?: string;
      email?: string;
      name?: string;
    };

    // Basic validation
    if (diet !== "meat" && diet !== "vegetarian" && diet !== "fish") {
      return NextResponse.json({ error: "Invalid diet option" }, { status: 400 });
    }
    if (!Array.isArray(attendanceChoices)) {
      return NextResponse.json(
        { error: "Invalid attendance choices" },
        { status: 400 }
      );
    }

    const normalizedAttendanceChoices: AttendanceChoice[] = [];
    for (const choice of attendanceChoices) {
      if (choice !== "panel" && choice !== "diner" && choice !== "none") {
        return NextResponse.json(
          { error: "Invalid attendance choices" },
          { status: 400 }
        );
      }

      if (!normalizedAttendanceChoices.includes(choice)) {
        normalizedAttendanceChoices.push(choice);
      }
    }

    if (normalizedAttendanceChoices.length === 0) {
      return NextResponse.json(
        { error: "At least one attendance option is required" },
        { status: 400 }
      );
    }
    if (normalizedAttendanceChoices.length > 2) {
      return NextResponse.json(
        { error: "A maximum of 2 attendance choices is allowed" },
        { status: 400 }
      );
    }
    if (
      normalizedAttendanceChoices.includes("none") &&
      normalizedAttendanceChoices.length > 1
    ) {
      return NextResponse.json(
        { error: "None cannot be combined with other attendance options" },
        { status: 400 }
      );
    }

    const trimmedToken = typeof token === "string" ? token.trim() : "";
    const fallbackEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (normalizedName.length > 120) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    if (!normalizedName) {
      return NextResponse.json(
        { error: "Please provide your name" },
        { status: 400 }
      );
    }

    let resolvedEmail: string | undefined = fallbackEmail || undefined;
    if (trimmedToken) {
      try {
        resolvedEmail = resolveRsvpToken(trimmedToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid RSVP token";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // Collect metadata (not all headers may be present in all deployments)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;
    const submittedAt = new Date().toISOString();

    await sendRsvpEmail({
      attendanceChoices: normalizedAttendanceChoices,
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
