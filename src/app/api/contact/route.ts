import { Resend } from "resend";
import { NextResponse } from "next/server";

const MAX_NAME = 256;
const MAX_MESSAGE = 5000;

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim() || "marina@yourdigitalist.com";

  if (!key || !from) {
    console.error("[api/contact] Missing RESEND_API_KEY or RESEND_FROM");
    return NextResponse.json(
      { error: "Contact form is not configured. Set RESEND_API_KEY and RESEND_FROM." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const honeypot = typeof o.honeypot === "string" ? o.honeypot.trim() : "";
  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const firstName =
    typeof o.firstName === "string" ? o.firstName.trim().slice(0, MAX_NAME) : "";
  const email = typeof o.email === "string" ? o.email.trim().slice(0, 256) : "";
  const message =
    typeof o.message === "string" ? o.message.trim().slice(0, MAX_MESSAGE) : "";
  const agreedToTerms = o.agreedToTerms === true;

  if (!firstName || !email || !message) {
    return NextResponse.json(
      { error: "Please fill in your name, email, and message." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!agreedToTerms) {
    return NextResponse.json(
      { error: "Please accept the terms to continue." },
      { status: 400 },
    );
  }

  const resend = new Resend(key);
  const subject = `Website contact: ${firstName}`;
  const html = `
    <p><strong>Name:</strong> ${escapeHtml(firstName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
  `;

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject,
    html,
  });

  if (error) {
    console.error("[api/contact] Resend error:", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again or email us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
