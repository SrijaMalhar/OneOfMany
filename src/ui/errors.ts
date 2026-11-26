// Turns SDK and network errors into one plain sentence that says what to do.

export function friendly(e: unknown): string {
  const msg = (e as Error)?.message ?? String(e)
  if (/blocked before sending/i.test(msg)) return msg
  if (/app.?check|attestation|recaptcha|unauthenticated|403/i.test(msg))
    return 'Firebase App Check rejected this browser. In development, register your debug token in the Firebase console; in production, check the reCAPTCHA site key and domain.'
  if (/429|quota|exhausted|rate/i.test(msg)) return 'The cloud model is out of free quota for now. Wait a minute and send the detective again.'
  if (/took longer|timed? ?out|deadline|abort/i.test(msg)) return 'The cloud model took too long to answer. Send the detective again; it will try a faster model.'
  if (/failed to fetch|network|offline/i.test(msg)) return 'Couldn’t reach the cloud. Check your connection and try again.'
  if (/api.?key|permission|not enabled|billing/i.test(msg))
    return 'Firebase AI Logic isn’t enabled for this project yet. Turn it on in the Firebase console, then try again.'
  return `Something went wrong: ${msg.slice(0, 160)}`
}
