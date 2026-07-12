import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactInfo } from '@/data/contact';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, message, website } = await request.json();

    // Honeypot: real users never see/fill this field. If it's filled, it's a
    // bot — pretend success without sending or saving anything.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are all required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Contact form is not configured yet (missing RESEND_API_KEY).' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: contactInfo.email,
      replyTo: email,
      subject: `New message from ${name} (via portfolio site)`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      console.error('Resend send failed:', error);
      return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
    }

    // Auto-reply to the sender — best-effort, doesn't block the response if it fails.
    resend.emails
      .send({
        from: 'Abir Abdullah <onboarding@resend.dev>',
        to: email,
        subject: "Thanks for reaching out",
        text: `Hi ${name},\n\nThanks for your message — I've received it and will get back to you soon.\n\nFor reference, here's what you sent:\n"${message}"\n\n— Abir Abdullah`,
      })
      .catch((err) => console.warn('Auto-reply failed (non-blocking):', err));

    // Save a copy so it's visible in the admin dashboard even if the email
    // gets missed. Best-effort — a DB failure shouldn't block the response
    // since the email itself already succeeded.
    try {
      const client = getSupabaseAdmin();
      await client.from('contact_messages').insert({
        name,
        email,
        message,
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Could not save contact message to Supabase (non-blocking):', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
