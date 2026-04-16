export async function onRequestPost(context) {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const body = await context.request.json();

    // Honeypot check — bots fill hidden fields
    if (body.website) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    const { name, email, phone, interest, message, consent } = body;

    // Validation
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers }
      );
    }

    if (!consent) {
      return new Response(
        JSON.stringify({ error: 'Privacy consent is required' }),
        { status: 400, headers }
      );
    }

    // Build email content — no sensitive data stored on server
    const interestLabels = {
      join: 'Join a program / הצטרפות לתוכנית',
      volunteer: 'Volunteer / התנדבות',
      donate: 'Donate / תרומה',
      partner: 'Partnership / שיתוף פעולה',
      other: 'Other / אחר',
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #3D2B1F;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #5C4033;">Name</td><td style="padding: 8px;">${escapeHtml(name)}</td></tr>
          <tr style="background: #F5F0E8;"><td style="padding: 8px; font-weight: bold; color: #5C4033;">Email</td><td style="padding: 8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #5C4033;">Phone</td><td style="padding: 8px;">${escapeHtml(phone || 'Not provided')}</td></tr>
          <tr style="background: #F5F0E8;"><td style="padding: 8px; font-weight: bold; color: #5C4033;">Interest</td><td style="padding: 8px;">${interestLabels[interest] || 'Not specified'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #5C4033;">Message</td><td style="padding: 8px;">${escapeHtml(message || 'No message')}</td></tr>
        </table>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">
          Submitted at ${new Date().toISOString()} | Privacy consent given
        </p>
      </div>
    `;

    // Send via Resend API
    // Requires RESEND_API_KEY environment variable in Cloudflare Pages settings
    const resendKey = context.env.RESEND_API_KEY;
    const notifyEmail = context.env.NOTIFY_EMAIL || 'info@keshetranch.com';

    if (resendKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Keshet Ranch <noreply@keshetranch.com>',
          to: [notifyEmail],
          subject: `New inquiry from ${name} — ${interestLabels[interest] || 'General'}`,
          html: emailHtml,
          reply_to: email,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error('Resend error:', err);
        return new Response(
          JSON.stringify({ error: 'Failed to send message' }),
          { status: 500, headers }
        );
      }
    } else {
      // Fallback: log only (dev mode or missing config)
      console.log('Contact submission (no email configured):', { name, email, phone, interest, message });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    );
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
