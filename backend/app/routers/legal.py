"""Public privacy policy and terms pages.

Served as plain HTML so there is one public URL for each (the App Store listing needs a
privacy policy URL, and the app links here). Keep them true to what the app actually does:
update this file whenever the app starts collecting or sharing something new.
"""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["legal"])

CONTACT_EMAIL = "zamaniziba18@gmail.com"
EFFECTIVE_DATE = "2 October 2026"

# Colours from the app's "Warm Paper, Deep Ink" palette (constants/atossaUI.ts).
_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Atossa</title>
<style>
  body {{ margin: 0; background: #F7F3EE; color: #1F1B18;
         font: 17px/1.55 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; }}
  main {{ max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }}
  .brand {{ color: #5A534D; font-weight: 600; }}
  h1 {{ font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: 34px;
        line-height: 1.2; margin: 24px 0 4px; }}
  h2 {{ font-size: 19px; margin: 32px 0 8px; }}
  .meta {{ color: #5A534D; font-size: 15px; margin: 0 0 24px; }}
  li {{ margin: 6px 0; }}
  a {{ color: #1F1B18; }}
  hr {{ border: 0; border-top: 1px solid #E2DAD0; margin: 40px 0 16px; }}
</style>
</head>
<body><main>
<div class="brand">Atossa</div>
<h1>{title}</h1>
<p class="meta">Effective {date}</p>
{body}
<hr>
<p class="meta">Questions? Email <a href="mailto:{email}">{email}</a>.</p>
</main></body>
</html>"""

_PRIVACY = """
<p>Atossa helps you put your symptoms into words and bring a clear summary to your doctor.
What you record is sensitive health information, so this page explains plainly what we
store, why, who else handles it, and how to delete it.</p>

<h2>What we store</h2>
<ul>
  <li><strong>Your account:</strong> your email address and name. If you sign up with an
  email and password, we store your password only in hashed form, never as plain text. If you
  use Sign in with Apple or Google, we receive your email address (and your name, if you share
  it) from them; we never see your Apple or Google password.</li>
  <li><strong>What you record in the app:</strong> symptoms in your own words, period days,
  appointments, medicines, health history and notes for your doctor.</li>
  <li><strong>Your settings:</strong> your usual cycle and period length, when your last period
  started, time zone, and reminder preferences.</li>
  <li><strong>Friends:</strong> if you invite someone or accept an invitation, we store that
  connection and the invited email address.</li>
</ul>

<h2>How we use it</h2>
<ul>
  <li>To run the app for you: keeping you signed in, saving what you record, and building your
  summary for your doctor.</li>
  <li>Reminders are scheduled on your phone; we don't send them from our servers.</li>
  <li>If you use voice input, your speech is turned into text on your phone by Apple's speech
  recognition. We don't receive audio recordings.</li>
</ul>
<p>We don't sell your information, show you ads, or use it for advertising. We don't track
you across other apps or websites.</p>

<h2>Who can see it</h2>
<ul>
  <li><strong>You.</strong> Your records are private to your account.</li>
  <li><strong>Friends you connect with</strong> see your name and your current cycle phase. To
  work out the phase, their app receives your usual cycle and period length and the dates of
  your last 12 periods. They never receive your symptoms, notes or other records. You can
  remove a friend at any time, which stops this sharing.</li>
  <li><strong>Your doctor</strong>, only if you choose to show or share your summary yourself.</li>
  <li><strong>Our service providers</strong>, which store and run things for us and may not use
  your information for anything else: Render (runs our server, in the United States), Supabase
  (hosts our database, in the European Union, Ireland), Apple and Google (only if you sign in
  with them), Groq (if you use the chat on Today, your messages are sent to Groq's AI model to
  write a reply; attached photos and files stay on your phone), Mixpanel (product analytics:
  which setup steps you finish, with a random app ID, your device type and app version, never
  your name, email, symptoms or notes), and Expo (delivers app updates, and receives standard technical details such as
  your device type and IP address when the app checks for an update).</li>
</ul>
<p>We will disclose information if the law requires us to.</p>

<h2>How it is protected</h2>
<p>Information travels between the app and our server over encrypted connections (HTTPS).
Your sign-in is kept in your phone's secure storage. Only the account that created a record
can read it through the app. If you are offline, a note waits on your phone until it can be
sent, and a copy of your records is kept on your phone; both are removed when you sign out
or delete your account.</p>

<h2>Why we use it</h2>
<p>We keep your notes and records because you ask us to: that is the service. Because they
are health information, we also ask for your agreement on the <strong>Before you start</strong>
screen. You can take that agreement back at any time by deleting your account.</p>

<h2>Keeping and deleting your information</h2>
<p>We keep your information for as long as you have an account. You can delete your account
at any time in the app: <strong>Profile &rarr; Delete account</strong>. That permanently
deletes your account and everything you've saved, straight away. Copies can remain in our
providers' backups, if they keep any, for a short time before they are overwritten. You can
also email us to ask for a copy of your information, to correct it, or to delete it. If you
email us, we will reply within one month.</p>

<h2>If you are unhappy</h2>
<p>Tell us using the email address at the top of this page and we will look into it and tell
you the outcome. You can also complain to the Information Commissioner's Office at ico.org.uk.</p>

<h2>Children</h2>
<p>Atossa is not meant for children under 16, and we don't knowingly collect their
information.</p>

<h2>Changes</h2>
<p>If we change what we collect or how we use it, we'll update this page and its date, and
tell you in the app before the change affects you.</p>
"""

_TERMS = """
<p>These terms apply when you use the Atossa app. By creating an account, you agree to them.</p>

<h2>What Atossa is, and isn't</h2>
<p>Atossa helps you record your symptoms in your own words and prepare a summary to take to
a doctor. <strong>It is not a medical service.</strong> It doesn't diagnose conditions, give
medical advice, or recommend treatment, and it doesn't replace a doctor. If you are worried
about your health, talk to a doctor. In an emergency, call your local emergency number.</p>

<h2>Your account</h2>
<ul>
  <li>Give a real email address you can use, and keep your password to yourself.</li>
  <li>You're responsible for what happens under your account.</li>
  <li>You can delete your account at any time in the app (Profile &rarr; Delete account).</li>
</ul>

<h2>Your information</h2>
<p>What you record belongs to you. You let us store and process it only to run the app for
you, as described in our <a href="/privacy">privacy policy</a>.</p>

<h2>Using Atossa fairly</h2>
<p>Don't use Atossa to harm others, to invite people who don't want to be contacted, to try
to get into other people's accounts, or to disrupt the service.</p>

<h2>The service</h2>
<p>Atossa is provided as it is, while we keep improving it. We do our best to keep it running
and your information safe, but we can't promise it will always be available or free of
errors, so please keep your own note of anything important. We may change or stop parts of
the app; if we ever shut it down, we'll give you notice so you can save what you need. We may
suspend accounts that break these terms.</p>

<h2>Limits</h2>
<p>As far as the law allows, we aren't liable for indirect losses, or for decisions made
based on what's recorded in the app. Nothing in these terms limits rights you have under
consumer law, and nothing excludes liability for death or personal injury caused by our
negligence, or for fraud.</p>

<h2>Changes</h2>
<p>If we change these terms, we'll update this page and its date, and tell you in the app
before a significant change takes effect.</p>
"""


def _render(title: str, body: str) -> HTMLResponse:
    return HTMLResponse(_PAGE.format(title=title, body=body, date=EFFECTIVE_DATE, email=CONTACT_EMAIL))


@router.get("/privacy", response_class=HTMLResponse, include_in_schema=False)
def privacy_policy():
    return _render("Privacy policy", _PRIVACY)


@router.get("/terms", response_class=HTMLResponse, include_in_schema=False)
def terms_of_service():
    return _render("Terms of use", _TERMS)
