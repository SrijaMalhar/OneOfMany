// Prompts. Instructions are embedded in the user turn because Chrome's
// on-device path receives only the request contents.

import { ATTRIBUTES, type Attribute, type DetectiveGuess, type Profile } from '../types'

const fence = (s: string) => `<<<\n${s}\n>>>`

export function lintPrompt(draft: string): string {
  return `You are a privacy checker running privately on the author's own device.
The author wants to post the DRAFT below anonymously. Find "tells": exact words or short phrases that could help a stranger work out who wrote it.
Look for: employer or product names, workplace details (office, cafeteria, tools, rituals), places and landmarks, team names, job titles, team sizes, specific dates or times, unique events, age, gender, family details, and anything that makes the author unique ("the only...", "the first...").
Rules:
- Copy each tell EXACTLY as written in the draft, 1 to 8 words.
- Most identifying first. At most 10 tells.
- "why" is under 12 words.
DRAFT:
${fence(draft)}`
}

export function detectivePrompt(draft: string, useSearch: boolean, earlierPosts: string[] = []): string {
  const attrs = ATTRIBUTES.map((a) => `- ${a}`).join('\n')
  const history = earlierPosts.length
    ? `\nThe same anonymous account published these EARLIER POSTS. Treat them as public and combine clues across all of them.\n${earlierPosts
        .map((p, i) => `EARLIER POST ${i + 1}:\n${fence(p)}`)
        .join('\n')}\n`
    : ''
  return `You are a privacy red-team auditor. The author of the POST below hired you to test whether it can be traced back to them before they publish it anonymously.
Work like a skilled online investigator. Infer facts about the author from clues in the text${
    useSearch
      ? ', and use Google Search to check public facts that narrow things down (office locations, team or product names, local landmarks, events, schedules)'
      : ''
  }.
Strict rules:
- Never try to find, guess or output any person's name, username, email, phone number or street address. Infer attributes only.
- "evidence" must be exact quotes copied from the text.
- Use "unknown" with confidence 0 when the text gives no real signal.
- confidence is an integer from 0 to 100.
Attributes to infer:
${attrs}
Also give "crowdSize": roughly how many people in the world would match all your confident guesses together (for example "under 20", "a few hundred", "tens of thousands"), and "nextStep": one sentence on what an investigator would check next.
Reply with ONLY a JSON object inside a \`\`\`json code block, shaped like:
{"guesses":[{"attribute":"city","guess":"...","confidence":80,"evidence":["..."],"reasoning":"..."}],"crowdSize":"...","nextStep":"..."}
${history}POST:
${fence(draft)}`
}

export function structurePrompt(auditText: string): string {
  return `Convert this privacy audit into JSON that matches the schema. Keep every guess, confidence, evidence quote and reasoning. Use attribute names exactly from the schema.
AUDIT:
${fence(auditText)}`
}

/** Runs ONLY on the device: it contains the private profile. */
export function gradePrompt(guesses: DetectiveGuess[], profile: Profile): string {
  const rows = guesses
    .filter((g) => profile[g.attribute])
    .map((g) => `- ${g.attribute} | GUESS: ${g.guess} | TRUTH: ${profile[g.attribute as Attribute]}`)
    .join('\n')
  return `You are checking, privately on the author's own device, which guesses an investigator got right about them.
For each row, compare GUESS with TRUTH and choose a verdict:
- "exact": the guess identifies the same thing. Synonyms, abbreviations, old names and parent companies count (NYC = New York, Bombay = Mumbai, Alphabet = Google).
- "close": the guess meaningfully narrows it down without being the same (the right metro area, the right kind of company, an age a few years off, a neighbouring team).
- "wrong": otherwise, or if the guess is vague.
Return one grade per row.
ROWS:
${rows}`
}

export function fixPrompt(draft: string, clues: string[]): string {
  return `You help an author keep their message but remove clues that identify them.
For each CLUE, write a replacement that keeps the meaning but is vaguer and natural in the sentence.
Examples: "in March" -> "recently"; "our Pune office" -> "our office"; "team of 6" -> "small team"; "the only woman engineer" -> "one of the engineers"; "!!!" -> "!".
If a clue adds nothing to the message, the replacement can be an empty string.
Rules: "original" must be copied exactly from the CLUES list. "reason" is under 10 words.
DRAFT:
${fence(draft)}
CLUES:
${clues.map((c) => `- ${c}`).join('\n')}`
}

/**
 * Runs ONLY on the device. The original draft holds the clues the author has
 * just decided not to publish, so it is never sent anywhere again.
 */
export function meaningPrompt(original: string, rewritten: string): string {
  return `You are checking, privately on the author's own device, whether a rewrite of their post still says what they meant.
Identifying details (names, places, dates, numbers, job titles, team sizes) were removed ON PURPOSE. Do not count those as lost.
Check only: the main complaint or story, how serious it is, what happened, and any question the author asks.
Give "score" from 0 to 100 (100 = the point is fully kept), "verdict" as one plain sentence under 16 words, and "lost" as up to 4 short phrases naming meaning that was lost (empty if none).
ORIGINAL:
${fence(original)}
REWRITE:
${fence(rewritten)}`
}
