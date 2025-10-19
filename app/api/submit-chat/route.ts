import { NextResponse } from "next/server";
import { sendChatEmail } from "@/lib/email-chat";

export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") || undefined;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const origin = req.headers.get("origin") || undefined;

    const body = await req.json();

    // Honeypot
    if (body.company && String(body.company).trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Very light validation
    const a = body.answers ?? {};
    if (
      !a ||
      !a.q1 ||
      !a.q2 ||
      !a.q3 ||
      !a.q4 ||
      !a.q5 ||
      !a.q6 ||
      !a.q7 ||
      !a.q8 ||
      a.consent !== true
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const q3n = Number(a.q3);
    if (!Number.isInteger(q3n) || q3n < 1 || q3n > 5) {
      return NextResponse.json(
        { error: "Invalid q3 value" },
        { status: 400 }
      );
    }

    const transcript = Array.isArray(body.transcript) ? body.transcript : [];
    const submittedAt = new Date().toISOString();

    await sendChatEmail({
      answers: {
        q1: String(a.q1),
        q2: String(a.q2),
        q3: q3n,
        q3_comment: a.q3_comment ? String(a.q3_comment) : "",
        q4: String(a.q4),
        q5: String(a.q5),
        q6: String(a.q6),
        q7: String(a.q7),
        q8: String(a.q8),
        q9: a.q9 ? String(a.q9) : "",
        q9_name_contact: a.q9_name_contact ? String(a.q9_name_contact) : "",
        consent: true,
      },
      transcript: transcript.map((m: any) => ({
        role: m.role === "user" ? "user" : "bot",
        text: String(m.text || ""),
        step: m.step,
      })),
      meta: { submittedAt, ip, ua, origin },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

