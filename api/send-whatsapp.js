export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { order, customerPhone } = req.body || {};
  if (!order) return res.status(400).json({ error: 'Missing "order" in request body' });

  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM,
    TEAM_WHATSAPP_NUMBERS,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return res.status(500).json({
      error: 'Server is missing Twilio environment variables. See the setup comments at the top of this file.',
    });
  }

  const message = buildOrderMessage(order);

  const recipients = [];
  if (customerPhone) recipients.push(toWhatsAppAddress(customerPhone));
  if (TEAM_WHATSAPP_NUMBERS) {
    recipients.push(...TEAM_WHATSAPP_NUMBERS.split(',').map((n) => n.trim()).filter(Boolean));
  }

  const results = [];
  for (const to of recipients) {
    try {
      const result = await sendTwilioWhatsApp({
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTH_TOKEN,
        from: TWILIO_WHATSAPP_FROM,
        to,
        body: message,
      });
      results.push({ to, ok: true, sid: result.sid });
    } catch (err) {
      results.push({ to, ok: false, error: String(err) });
    }
  }

  return res.status(200).json({ sent: results });
}

function toWhatsAppAddress(phone) {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  return `whatsapp:+${digits}`;
}

function buildOrderMessage(order) {
  return (
    `*3N Electronics — Order ${order.order_id}*\n\n` +
    `${order.items_list}\n\n` +
    `Subtotal: ${order.subtotal}\n` +
    `Shipping: ${order.shipping}\n` +
    `*Total: ${order.total}*\n\n` +
    `Ship to: ${order.address}\n` +
    `Phone: ${order.phone}\n` +
    `Payment ref: ${order.payment_ref}`
  );
}

async function sendTwilioWhatsApp({ accountSid, authToken, from, to, body }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', to);
  params.append('Body', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Twilio API error (${response.status})`);
  }
  return data;
}
