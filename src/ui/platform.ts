// Where a post is headed, for the checklist's site-specific advice.

export type Platform = 'reddit' | 'glassdoor' | 'blind' | 'internal' | 'other'

/** Guess the platform from where a sample story was meant to go. */
export function platformOf(where: string | undefined): Platform | undefined {
  if (!where) return undefined
  if (/^r\//i.test(where) || /reddit/i.test(where)) return 'reddit'
  if (/glassdoor/i.test(where)) return 'glassdoor'
  if (/blind/i.test(where)) return 'blind'
  if (/slack|teams|intranet|forum/i.test(where)) return 'internal'
  return undefined
}
