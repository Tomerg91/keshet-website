export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // Honeypot check
    if (body.website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { name, email, phone, interest, message } = body;

    // Basic validation
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For now, log the submission.
    // TODO: Replace with email sending (e.g., via Mailgun, SendGrid, or Cloudflare Email Workers)
    // TODO: Replace with CiviCRM API call when CRM is deployed
    console.log('Contact form submission:', {
      name,
      email,
      phone: phone || '',
      interest: interest || '',
      message: message || '',
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Message received' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
