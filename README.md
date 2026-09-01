# 3N Electronics — Automated WhatsApp Backend

This is the missing piece that lets your site send WhatsApp order
notifications **automatically, with zero clicks** — to both the customer
and your team.

## Why this exists as a separate thing

Your website is a single HTML file with no server. WhatsApp's rules mean
automated sending can only happen from a real server that holds a secret
API key — a website's own code can never hold that key safely (anyone
could open their browser's dev tools and steal it). So this one small
piece has to live somewhere else. Everything else about your site stays
exactly as it is; this just plugs in.

## What you need (one-time setup, ~15–20 minutes)

1. **A Twilio account** — https://www.twilio.com/try-twilio (free to sign up)
2. **A Vercel account** — https://vercel.com/signup (free tier is enough for this)
3. **A GitHub account** — to hold this small project (also free)

## Step-by-step

### 1. Activate WhatsApp on Twilio
- Log into the Twilio Console.
- Go to **Messaging → Try it out → Send a WhatsApp message**.
- Follow the prompts to join the WhatsApp Sandbox (for testing) — or apply
  for a proper WhatsApp Business sender if you want to message customers
  who haven't first messaged you (needed for real production use).
- Note down, from the Twilio Console:
  - **Account SID**
  - **Auth Token**
  - Your **Twilio WhatsApp number** (e.g. `whatsapp:+14155238886`)

### 2. Put this project on GitHub
- Create a new, empty GitHub repository.
- Upload this whole `whatsapp-backend` folder into it (drag-and-drop
  works fine on github.com, or use `git push` if you're comfortable
  with git).

### 3. Deploy to Vercel
- Log into Vercel → **Add New → Project** → import the GitHub repo you
  just created.
- Before the first deploy, open **Environment Variables** and add:

| Name | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | from Twilio Console |
| `TWILIO_AUTH_TOKEN` | from Twilio Console |
| `TWILIO_WHATSAPP_FROM` | e.g. `whatsapp:+14155238886` |
| `TEAM_WHATSAPP_NUMBERS` | comma-separated, e.g. `whatsapp:+919876543210,whatsapp:+919123456780` |

- Click **Deploy**.
- Once done, Vercel gives you a URL like `https://your-project.vercel.app`.

### 4. Connect it to your site
- Your endpoint is: `https://your-project.vercel.app/api/send-whatsapp`
- Open your site's admin → **Settings → Automated WhatsApp invoice**
- Paste that URL into the **Webhook URL** field and save.

That's it. From now on, every order placed on the site automatically
triggers a WhatsApp message to the customer and to every number listed in
`TEAM_WHATSAPP_NUMBERS` — nobody has to click "send."

## Cost

Twilio charges a small per-message fee (typically a few cents, varies by
country) for WhatsApp messages — there's no unlimited free tier for
production sending. The sandbox is free while testing. Vercel's free tier
is more than enough for this function's traffic.

## Testing it

You can test the endpoint directly before wiring it into the site:

```bash
curl -X POST https://your-project.vercel.app/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "9876543210",
    "order": {
      "order_id": "TEST-0001",
      "items_list": "1x ESP32 Dev Board @ ₹499",
      "subtotal": "₹499",
      "shipping": "FREE",
      "total": "₹499",
      "address": "123 Test Street, Test City",
      "phone": "9876543210",
      "payment_ref": "TEST-REF"
    }
  }'
```

If it's working, you (and the test phone number, if it's joined your
Twilio Sandbox) will receive a WhatsApp message within a few seconds.
