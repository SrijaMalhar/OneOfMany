// Sample stories. Fictional people and fictional employers; the clues are
// realistic on purpose so the detective has something real to work with.

import type { Profile } from './types'

export interface Sample {
  id: string
  title: string
  /** Where the person meant to post it. */
  where: string
  draft: string
  vault: Profile
}

export const SAMPLES: Sample[] = [
  {
    id: 'oncall',
    title: 'Burned-out engineer',
    where: 'r/cscareerquestions',
    draft:
      "Throwaway because my manager reads this sub. Since the reorg in March, our on-call rotation for the UPI settlement service went from 8 people to 3. I'm the only woman engineer left on the team and I've been here 2 years, so I get every 3am page. Last Thursday I was paged four times and still had to demo at the Friday all-hands in the Bellandur office. Our skip-level just keeps saying 'we're a family'!!! Should I quit before my bonus vests?",
    vault: {
      employer: 'Lakeview Pay',
      industry: 'fintech payments',
      city: 'Bengaluru',
      country: 'India',
      team_or_department: 'payments settlement',
      job_role: 'backend engineer',
      seniority: 'mid-level',
      tenure: '2 years',
      age_range: '27',
      gender: 'woman',
    },
  },
  {
    id: 'nurse',
    title: 'Night-shift nurse',
    where: 'r/nursing',
    draft:
      "Posting from a new account. I'm one of only two night-shift nurses on the pediatric ward at the hospital right by the ferry terminal, and since the new director came in from Seattle in January we've been running 1:9 ratios. Two weeks ago a kid on our ward was moved to ICU and nobody from management even came in. I'm 34, I've been here 6 years, and I'm terrified to report this. Is there a safe way to escalate?",
    vault: {
      employer: 'Saltmarsh Children’s Hospital',
      industry: 'healthcare',
      city: 'Bremerton',
      country: 'USA',
      team_or_department: 'pediatric ward',
      job_role: 'registered nurse',
      seniority: 'senior',
      tenure: '6 years',
      age_range: '34',
      gender: 'woman',
    },
  },
  {
    id: 'phd',
    title: 'PhD student and advisor',
    where: 'r/AskAcademia',
    draft:
      "Using a throwaway. I'm a 3rd-year PhD student in the only lab in our department that works on coral reef acoustics. My advisor takes first authorship on papers I write and told me my funding 'depends on my attitude' after I pushed back at our group meeting before the Ocean Sciences conference. Our department is small and I'm the only international student in the lab. What are my options?",
    vault: {
      employer: 'Pacific Tidewater University',
      industry: 'academia',
      city: 'Honolulu',
      country: 'USA',
      team_or_department: 'marine biology',
      job_role: 'PhD student',
      seniority: 'student',
      tenure: '3 years',
      age_range: '26',
      gender: 'man',
    },
  },
]
