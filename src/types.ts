// Shared domain types.

export const TELL_KINDS = [
  'employer',
  'workplace_detail',
  'location',
  'team_or_role',
  'time',
  'event',
  'demographic',
  'relationship',
  'style',
  'other',
] as const
export type TellKind = (typeof TELL_KINDS)[number]

export const TELL_KIND_LABEL: Record<TellKind, string> = {
  employer: 'Employer',
  workplace_detail: 'Workplace detail',
  location: 'Place',
  team_or_role: 'Team or role',
  time: 'Time',
  event: 'Event',
  demographic: 'About you',
  relationship: 'Family',
  style: 'Writing style',
  other: 'Contact detail',
}

export type Risk = 'low' | 'medium' | 'high'

/** Where a finding came from. */
export type Origin = 'rule' | 'on_device' | 'in_cloud'

export interface Tell {
  start: number
  end: number
  text: string
  kind: TellKind
  why: string
  risk: Risk
  origins: Origin[]
}

/** Attributes the detective tries to infer. Order matters for display. */
export const ATTRIBUTES = [
  'employer',
  'industry',
  'city',
  'country',
  'team_or_department',
  'job_role',
  'seniority',
  'tenure',
  'age_range',
  'gender',
] as const
export type Attribute = (typeof ATTRIBUTES)[number]

export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  employer: 'Employer',
  industry: 'Industry',
  city: 'City',
  country: 'Country',
  team_or_department: 'Team',
  job_role: 'Job role',
  seniority: 'Seniority',
  tenure: 'Time at job',
  age_range: 'Age',
  gender: 'Gender',
}

export const ATTRIBUTE_HINT: Record<Attribute, string> = {
  employer: 'Company or organisation',
  industry: 'Fintech, healthcare…',
  city: 'Bengaluru',
  country: 'India',
  team_or_department: 'Payments settlement',
  job_role: 'Backend engineer',
  seniority: 'Junior, senior…',
  tenure: '2 years',
  age_range: '27',
  gender: 'Woman',
}

/** The private "who you really are" vault. Never leaves the device. */
export type Profile = Partial<Record<Attribute, string>>

export interface DetectiveGuess {
  attribute: Attribute
  guess: string
  confidence: number
  evidence: string[]
  reasoning: string
}

export interface DetectiveReport {
  guesses: DetectiveGuess[]
  crowdSize: string
  nextStep: string
  searchQueries: string[]
  sources: { title: string; uri: string }[]
  searchEntryPointHtml?: string
  usedSearch: boolean
  /** The cloud model that actually produced the report. */
  model: string
  ms: number
}

export type Verdict = 'exact' | 'close' | 'wrong' | 'no_truth' | 'not_guessed'

export interface Grade {
  attribute: Attribute
  verdict: Verdict
  /** Who decided the verdict. */
  by: 'on_device' | 'rule' | 'you'
}

export interface Fix {
  original: string
  replacement: string
  reason: string
  accepted: boolean
}

export interface MeaningCheck {
  /** 0–100: how much of the point and evidence survived the rewrite. */
  score: number
  verdict: string
  lost: string[]
  by: 'on_device' | 'rule'
}

export type Source = 'on_device' | 'in_cloud'
