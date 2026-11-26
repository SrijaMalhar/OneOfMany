// Benchmark set: 30 fictional people, each with an anonymous post they might
// write and the truth about them. Employers are invented; places are real so
// the clues behave like real ones. No real person is described.

import type { Profile } from '../types'

export interface BenchCase {
  id: string
  label: string
  draft: string
  vault: Profile
}

const v = (
  employer: string, industry: string, city: string, country: string, team: string,
  role: string, seniority: string, tenure: string, age: string, gender: string,
): Profile => ({
  employer, industry, city, country, team_or_department: team, job_role: role,
  seniority, tenure, age_range: age, gender,
})

export const BENCH_CASES: BenchCase[] = [
  {
    id: 'blr-fintech',
    label: 'Fintech engineer, Bengaluru',
    draft: "Since the reorg in March our on-call rotation for the UPI settlement service went from 8 people to 3. I'm the only woman engineer left on the team and I've been here 2 years, so I get every 3am page. Last Thursday I still had to demo at the Friday all-hands in the Bellandur office. Should I quit before my bonus vests?",
    vault: v('Lakeview Pay', 'fintech payments', 'Bengaluru', 'India', 'payments settlement', 'backend engineer', 'mid-level', '2 years', '27', 'woman'),
  },
  {
    id: 'pune-nurse',
    label: 'ICU nurse, Pune',
    draft: "I'm one of four night-shift nurses in the cardiac ICU at a private hospital near Koregaon Park. Since the new administrator came from Mumbai in June we've been covering 1:4 ratios. I'm 31 and have been here five years, and last week I had to hold a family's hand because no doctor came for forty minutes. How do I complain without being identified?",
    vault: v('Riverbend Heartcare', 'healthcare', 'Pune', 'India', 'cardiac ICU', 'staff nurse', 'senior', '5 years', '31', 'woman'),
  },
  {
    id: 'hyd-qa',
    label: 'QA lead, Hyderabad',
    draft: "Our QA team in the HITEC City office was cut from 14 to 6 in the October layoffs, and as the only QA lead left I now sign off every release for the insurance claims app. My manager joined from the Chennai office three months ago and keeps pushing Friday-night deploys. I'm 34 and planning my second kid. Is it normal to be this burned out?",
    vault: v('Northgate Systems', 'IT services', 'Hyderabad', 'India', 'quality assurance', 'QA lead', 'lead', '6 years', '34', 'man'),
  },
  {
    id: 'chn-teacher',
    label: 'School teacher, Chennai',
    draft: "I teach Class 9 chemistry at a CBSE school in Velachery and I'm the only science teacher who stayed after the management change in April. The new principal wants us to inflate internal marks before the board inspection. I've been here 8 years and I'm 39. If I report it to the board, will they know it was me?",
    vault: v('Velachery Public School', 'education', 'Chennai', 'India', 'science department', 'chemistry teacher', 'senior', '8 years', '39', 'woman'),
  },
  {
    id: 'mum-analyst',
    label: 'Equity analyst, Mumbai',
    draft: "I'm a 26-year-old analyst on the pharma coverage desk at a mid-sized brokerage in BKC. Our team of 5 was told to keep a 'buy' rating on a client company even after the plant inspection failed in August. I joined straight out of IIM last year. Do I go to SEBI or just leave?",
    vault: v('Kestrel Securities', 'finance', 'Mumbai', 'India', 'pharma research', 'equity analyst', 'junior', '1 year', '26', 'man'),
  },
  {
    id: 'kochi-dev',
    label: 'Android developer, Kochi',
    draft: "I'm the only Android dev at a 20-person startup in Infopark Kakkanad building a fishing-boat tracking app. The founders haven't paid salaries for two months since the seed round fell through in July. I'm 24, it's my first job, and I need the experience letter. What can I do?",
    vault: v('Tidewave Labs', 'software', 'Kochi', 'India', 'mobile', 'Android developer', 'junior', '1 year', '24', 'man'),
  },
  {
    id: 'sea-sre',
    label: 'SRE, Seattle',
    draft: "Throwaway. I'm an SRE on the storage reliability team at a cloud company in South Lake Union, one of two women on a team of eleven. After the incident in September, leadership blamed our on-call for an outage that was caused by a rushed launch. I've been here three years and I'm 33. Do I write the postmortem honestly?",
    vault: v('Cascade Cloudworks', 'cloud computing', 'Seattle', 'USA', 'storage reliability', 'site reliability engineer', 'senior', '3 years', '33', 'woman'),
  },
  {
    id: 'atx-sales',
    label: 'Sales rep, Austin',
    draft: "I'm an account exec at a 300-person HR software company on East 6th, and our VP of sales told the West region team to backdate contracts so Q3 looks better. I'm 29, I've been here 18 months, and I'm the top seller in my pod of four. Is this something I can report anonymously?",
    vault: v('Brightpath HR', 'HR software', 'Austin', 'USA', 'west region sales', 'account executive', 'mid-level', '18 months', '29', 'man'),
  },
  {
    id: 'pit-postdoc',
    label: 'Postdoc, Pittsburgh',
    draft: "I'm a second-year postdoc in a robotics lab in Oakland, Pittsburgh, and the only one in our group of 9 working on underwater grippers. My PI put his name first on my paper for the ICRA deadline and said my visa renewal depends on 'being a team player'. I'm 31. What are my options?",
    vault: v('Allegheny Institute of Technology', 'academia', 'Pittsburgh', 'USA', 'robotics lab', 'postdoctoral researcher', 'early career', '2 years', '31', 'man'),
  },
  {
    id: 'oh-warehouse',
    label: 'Warehouse picker, Ohio',
    draft: "I work the overnight shift at a fulfilment center off I-71 near Columbus, and since the new rate targets in May our building has had three ambulance calls. I'm 45, one of the few older pickers left on the 2nd floor, and I've been there four years. Who do I tell without losing my job?",
    vault: v('Buckeye Logistics', 'logistics', 'Columbus', 'USA', 'second-floor picking', 'warehouse picker', 'staff', '4 years', '45', 'woman'),
  },
  {
    id: 'bos-resident',
    label: 'Medical resident, Boston',
    draft: "I'm a PGY-2 in internal medicine at a teaching hospital in the Longwood area, and our program director logs our hours as 80 when we regularly do 95. There are only 12 residents in my year and I'm the only one from Kenya. I'm 29. Is reporting to ACGME actually anonymous?",
    vault: v('Longwood General Hospital', 'healthcare', 'Boston', 'USA', 'internal medicine', 'resident physician', 'trainee', '2 years', '29', 'woman'),
  },
  {
    id: 'hnl-phd',
    label: 'PhD student, Honolulu',
    draft: "I'm a 3rd-year PhD student in the only lab in our department that works on coral reef acoustics. My advisor takes first authorship on papers I write and said my funding depends on my attitude after I pushed back at group meeting before the Ocean Sciences conference. I'm the only international student in the lab.",
    vault: v('Pacific Tidewater University', 'academia', 'Honolulu', 'USA', 'marine biology', 'PhD student', 'student', '3 years', '26', 'man'),
  },
  {
    id: 'man-teacher',
    label: 'Primary teacher, Manchester',
    draft: "I'm a Year 4 teacher at an academy in Didsbury and our head has been coaching kids on the SATs reading paper before Ofsted's visit in February. I'm 28, newly qualified two years ago, and the only male teacher in the school. Can I report it without everyone knowing it's me?",
    vault: v('Didsbury Oaks Academy', 'education', 'Manchester', 'UK', 'Year 4', 'primary teacher', 'early career', '2 years', '28', 'man'),
  },
  {
    id: 'lds-call',
    label: 'Call-centre agent, Leeds',
    draft: "I work at a broadband provider's call centre by Leeds station, on the retentions team of about 30. Since the new scripts in January we're told to say cancellations can only be done by post, which isn't true. I'm 22, been there a year, and I do the late shift till 10pm. Should I tell Ofcom?",
    vault: v('Northern Fibre', 'telecoms', 'Leeds', 'UK', 'customer retentions', 'call centre agent', 'junior', '1 year', '22', 'woman'),
  },
  {
    id: 'tor-lawyer',
    label: 'Junior lawyer, Toronto',
    draft: "I'm a second-year associate in the employment group at a Bay Street firm, one of three associates in that group. A partner keeps billing my hours as his on a big retail client file. I'm 27 and still paying off law school. Is there any way to raise this with the Law Society confidentially?",
    vault: v('Harcourt Lane LLP', 'legal', 'Toronto', 'Canada', 'employment law', 'associate lawyer', 'junior', '2 years', '27', 'woman'),
  },
  {
    id: 'mtl-gamedev',
    label: 'Game developer, Montreal',
    draft: "I'm a gameplay programmer at a studio in Mile End, on the combat team for an unannounced open-world game. We've been in crunch since the June delay, 60-hour weeks, and the producer said overtime is 'expected but not paid' for salaried staff. I'm 30, I moved from France for this job two years ago. Is this legal in Quebec?",
    vault: v('Studio Lanterne', 'video games', 'Montreal', 'Canada', 'combat gameplay', 'gameplay programmer', 'mid-level', '2 years', '30', 'man'),
  },
  {
    id: 'ber-designer',
    label: 'Product designer, Berlin',
    draft: "I'm the only product designer at a 40-person scooter-sharing startup in Kreuzberg. The CEO asked me to hide the cancellation button behind three screens before the Series B. I'm 32, I've been here since the pilot launch in 2023. Is it worth refusing and losing my residence permit?",
    vault: v('Glide Mobility', 'mobility', 'Berlin', 'Germany', 'product design', 'product designer', 'senior', '3 years', '32', 'woman'),
  },
  {
    id: 'dub-support',
    label: 'Support specialist, Dublin',
    draft: "I'm on the Arabic-language trust and safety team at a social app's EMEA office in the Docklands, one of four Arabic speakers. We're reviewing 900 posts a shift since the August cuts and counselling sessions were cancelled. I'm 26 and moved from Amman last year. Who can I talk to?",
    vault: v('Chatter Social', 'social media', 'Dublin', 'Ireland', 'trust and safety', 'content reviewer', 'junior', '1 year', '26', 'woman'),
  },
  {
    id: 'lag-bank',
    label: 'Bank officer, Lagos',
    draft: "I'm a relationship officer at a bank branch on Adeola Odeku in Victoria Island. Our branch manager has been asking us to open accounts for customers who never came in, to hit the November target. There are only 7 of us in the branch and I'm the youngest at 25. If I report to the CBN, will the bank find out?",
    vault: v('Coastline Bank', 'banking', 'Lagos', 'Nigeria', 'retail branch', 'relationship officer', 'junior', '2 years', '25', 'man'),
  },
  {
    id: 'nbo-ngo',
    label: 'NGO officer, Nairobi',
    draft: "I'm a programme officer at an international health NGO in Westlands. Our country director reported 4,000 mothers reached by the mobile clinic project when we reached about 1,500. I manage the Kisumu field data, I'm 35, and I've been here four years. Can I alert the donor without being traced?",
    vault: v('Bridges Health International', 'non-profit', 'Nairobi', 'Kenya', 'maternal health programme', 'programme officer', 'mid-level', '4 years', '35', 'woman'),
  },
  {
    id: 'mnl-bpo',
    label: 'BPO team lead, Manila',
    draft: "I'm a team lead for a US airline account at a BPO in BGC, the graveyard shift. Our ops manager deletes calls from QA if they make the team score look bad, and the airline is about to renew the contract. I lead 14 agents, I'm 28, five years in. Should I tell the client?",
    vault: v('Archipelago Contact Solutions', 'BPO', 'Manila', 'Philippines', 'airline account', 'team lead', 'lead', '5 years', '28', 'man'),
  },
  {
    id: 'mel-chef',
    label: 'Sous chef, Melbourne',
    draft: "I'm the sous chef at a hatted restaurant on Flinders Lane. The owner pays the two kitchen hands on student visas below award and cash in hand, and asked me to keep the rosters off the system. I'm 36, been here since we reopened after lockdown. What happens if I call the Fair Work Ombudsman?",
    vault: v('Ember & Salt', 'hospitality', 'Melbourne', 'Australia', 'kitchen', 'sous chef', 'senior', '5 years', '36', 'man'),
  },
  {
    id: 'sgp-trader',
    label: 'Commodities analyst, Singapore',
    draft: "I'm a junior analyst on the palm oil desk at a trading house in Marina Bay, one of two analysts. My head of desk asked me to change a supplier's deforestation flag before the bank audit in March. I'm 25, on an Employment Pass, eight months in. Is there a safe way to escalate?",
    vault: v('Straits Commodities', 'commodity trading', 'Singapore', 'Singapore', 'palm oil desk', 'commodities analyst', 'junior', '8 months', '25', 'woman'),
  },
  {
    id: 'osa-factory',
    label: 'Factory engineer, Osaka',
    draft: "I'm a quality engineer at a parts maker's plant in Higashiosaka that supplies brake components. My section chief told me to sign off on a batch that failed the heat test in October. Our section has 6 people and I'm the only foreign engineer, from Vietnam. I'm 30. What protections do whistleblowers have here?",
    vault: v('Kansai Precision Parts', 'automotive manufacturing', 'Osaka', 'Japan', 'quality control', 'quality engineer', 'mid-level', '3 years', '30', 'man'),
  },
  {
    id: 'mty-hr',
    label: 'HR generalist, Monterrey',
    draft: "I work in HR at an appliance plant in Apodaca and the plant manager told me to quietly let go of every worker who joined the independent union vote in September. I'm the only HR person on the second shift, I'm 33, and I've been there six years. Can I go to the labor authorities anonymously?",
    vault: v('Norte Appliances', 'manufacturing', 'Monterrey', 'Mexico', 'human resources', 'HR generalist', 'mid-level', '6 years', '33', 'woman'),
  },
  {
    id: 'blr-intern',
    label: 'Data intern, Bengaluru',
    draft: "I'm interning on the analytics team at a food-delivery startup in Koramangala, one of two interns from my college batch. My manager asked me to remove late-delivery orders from the dashboard before the investor call. I'm 21 and my stipend ends in December. Will saying no hurt my PPO?",
    vault: v('Swiftbite', 'food delivery', 'Bengaluru', 'India', 'analytics', 'data analyst intern', 'intern', '4 months', '21', 'woman'),
  },
  {
    id: 'del-journalist',
    label: 'Reporter, Delhi',
    draft: "I'm a 27-year-old reporter on the city desk of a Hindi news channel in Noida Film City. Our editor killed my story about a builder in Sector 150 after the builder's company bought ad slots in October. I'm one of three reporters on the desk. Should I give the story to another outlet?",
    vault: v('Sach Times 24', 'media', 'Noida', 'India', 'city desk', 'reporter', 'junior', '3 years', '27', 'man'),
  },
  {
    id: 'sf-pm',
    label: 'Product manager, San Francisco',
    draft: "I'm a PM on the teen safety team at a messaging app in SoMa. We shipped age verification that we know fails for about a third of users, and leadership asked us not to mention it in the transparency report due in January. Our team is five people and I'm the only PM. I'm 34. What are my options?",
    vault: v('Signalwave', 'social media', 'San Francisco', 'USA', 'teen safety', 'product manager', 'senior', '4 years', '34', 'woman'),
  },
  {
    id: 'lon-accountant',
    label: 'Auditor, London',
    draft: "I'm an audit senior at a mid-tier firm near Moorgate, on the retail client team. My manager told me to sign off stock counts I never attended for a fashion chain's year end in April. I'm 26, ACA qualified last year, and one of four seniors on the job. Can I report to the ICAEW anonymously?",
    vault: v('Pemberton Rowe LLP', 'accounting', 'London', 'UK', 'retail audit', 'audit senior', 'mid-level', '4 years', '26', 'man'),
  },
  {
    id: 'blr-hostel',
    label: 'Student, Bengaluru',
    draft: "I'm a third-year CSE student at a private university off Kanakapura Road and the hostel warden fines girls ₹500 for coming back after 8pm but not the boys. I'm the class rep for our section of 60, so if I post about it on the college confession page people might guess it's me. I'm 20. How do I raise this safely?",
    vault: v('Southfield University', 'education', 'Bengaluru', 'India', 'computer science', 'student', 'student', '3 years', '20', 'woman'),
  },
]
