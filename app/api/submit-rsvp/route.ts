import { NextResponse } from "next/server";
import { sendRsvpEmail } from "@/lib/email-rsvp";
import { resolveRsvpToken } from "@/lib/rsvp-token";

type AttendanceChoice = "panel" | "diner" | "none";
type ProfessionalStatus = "developer" | "internship" | "none";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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
 *  - intra?: string
 *  - cohort?: string | number
 *  - professionalStatus?: "developer" | "internship" | "none"
 *  - professionalDuration?: string
 *
 * Returns a JSON object with success=true on success or an error message
 * otherwise. On submission, an email is sent to the TEAM_EMAIL address
 * configured for this deployment.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      attendanceChoices,
      diet,
      intolerances,
      token,
      email,
      name,
      intra,
      cohort,
      professionalStatus,
      professionalDuration,
    } = body as {
      attendanceChoices: unknown;
      diet: "meat" | "vegetarian" | "fish";
      intolerances: string;
      token?: string;
      email?: string;
      name?: string;
      intra?: string;
      cohort?: unknown;
      professionalStatus?: unknown;
      professionalDuration?: unknown;
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
    const normalizedIntra = typeof intra === "string" ? intra.trim() : "";
    const normalizedCohortRaw =
      typeof cohort === "string"
        ? cohort.trim()
        : typeof cohort === "number"
          ? String(cohort)
          : "";
    const parsedCohort = normalizedCohortRaw ? Number(normalizedCohortRaw) : null;
    const isValidCohortInteger =
      parsedCohort !== null && Number.isInteger(parsedCohort);
    const normalizedCohort = isValidCohortInteger ? String(parsedCohort) : "";
    const normalizedProfessionalDuration =
      typeof professionalDuration === "string"
        ? professionalDuration.trim()
        : "";

    if (normalizedName.length > 120) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    if (normalizedIntra.length > 120) {
      return NextResponse.json({ error: "42 intra is too long" }, { status: 400 });
    }
    if (
      normalizedCohortRaw &&
      (!isValidCohortInteger || parsedCohort < 2018 || parsedCohort > 2026)
    ) {
      return NextResponse.json(
        { error: "Cohort must be between 2018 and 2026" },
        { status: 400 }
      );
    }
    if (normalizedProfessionalDuration.length > 120) {
      return NextResponse.json(
        { error: "Professional duration is too long" },
        { status: 400 }
      );
    }
    if (!trimmedToken && fallbackEmail && !isValidEmail(fallbackEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }
    if (
      professionalStatus !== undefined &&
      professionalStatus !== "developer" &&
      professionalStatus !== "internship" &&
      professionalStatus !== "none"
    ) {
      return NextResponse.json(
        { error: "Invalid professional status" },
        { status: 400 }
      );
    }
    const normalizedProfessionalStatus = professionalStatus as
      | ProfessionalStatus
      | undefined;
    if (
      (normalizedProfessionalStatus === "developer" ||
        normalizedProfessionalStatus === "internship") &&
      !normalizedProfessionalDuration
    ) {
      return NextResponse.json(
        { error: "Please provide professional duration" },
        { status: 400 }
      );
    }
    if (
      normalizedProfessionalStatus === "none" &&
      normalizedProfessionalDuration
    ) {
      return NextResponse.json(
        { error: "Professional duration should be empty for 'none'" },
        { status: 400 }
      );
    }

    if (!normalizedName && !normalizedIntra && !fallbackEmail && !trimmedToken) {
      return NextResponse.json(
        { error: "Please provide your name, 42 intra, or email" },
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

    try {
      await sendRsvpEmail({
        attendanceChoices: normalizedAttendanceChoices,
        diet,
        intolerances: intolerances ?? "",
        email: resolvedEmail,
        name: normalizedName || undefined,
        intra: normalizedIntra || undefined,
        cohort: normalizedCohort || undefined,
        professionalStatus: normalizedProfessionalStatus,
        professionalDuration: normalizedProfessionalDuration || undefined,
        meta: { submittedAt, ip, ua },
      });
    } catch (err) {
      // Keep localhost testing unblocked when email provider config is incomplete.
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to send RSVP email in development mode:", err);
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
