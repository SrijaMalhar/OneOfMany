// OneOfMany: the left pane is your device, the right pane is the cloud.
// Your draft crosses the line between them; your vault never does.

import { useEffect, useMemo, useRef, useState } from 'react'
import { audit as auditRecords } from './ai/receipt'
import { prepareDeviceModel } from './ai/models'
import { checkMeaning, findTells, gradePrivately, runDetective, suggestFixes, testFirewall, type FirewallTestResult } from './ai/tasks'
import { blurSpan, replaceSpan } from './engine/blur'
import { applyFixes, cluesToRewrite } from './engine/fixes'
import { exposure, type Fact } from './engine/grade'
import { contentWords } from './engine/meaning'
import { combineTells, locate, modelTells, ruleTells, type ModelTell } from './engine/tells'
import { DEFAULT_SETTINGS, isConfigured, loadSettings } from './firebase'
import { SAMPLES } from './samples'
import {
  forgetEverything,
  loadDraft,
  loadShareChoice,
  loadVault,
  readCounts,
  saveDraft,
  saveShareChoice,
  saveVault,
  shareCounts,
  type Counts,
} from './store'
import { ATTRIBUTES, type Attribute, type Grade, type Profile, type Source, type Verdict } from './types'
import { BeforeYouPost } from './ui/BeforeYouPost'
import { Detective, type DetectiveState } from './ui/Detective'
import { EarlierPosts } from './ui/EarlierPosts'
import { friendly } from './ui/errors'
import { Fixes, type FixState, type MeaningState } from './ui/Fixes'
import { Footer } from './ui/Footer'
import { Giveaways } from './ui/Giveaways'
import { Header } from './ui/Header'
import { evidenceTells, withHeat } from './ui/heat'
import { useDeviceStatus, useOnline, useReceipt } from './ui/hooks'
import { HowItWorks } from './ui/HowItWorks'
import { CloudIcon, InfoIcon, LockIcon } from './ui/icons'
import { Receipt } from './ui/Receipt'
import { Report, Runs, type Run, type RunView } from './ui/Report'
import { Seam } from './ui/Seam'
import { Threads, type Link } from './ui/Threads'
import { now } from './ui/time'
import { Nobody } from './landing/art'
import { coach } from './ui/coach'
import { useTheme } from './ui/theme'
import { Toaster } from './ui/Toaster'
import { toast } from './ui/toasts'
import { Vault } from './ui/Vault'
import { Viewfinder } from './ui/Viewfinder'

const MIN_WORDS = 15

function wordCount(s: string) {
  return (s.match(/\S+/g) ?? []).length
}

export default function App() {
  const [theme, setTheme] = useTheme()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  const [device, recheckDevice] = useDeviceStatus()
  const deviceReady = device === 'available'
  const online = useOnline()
  const records = useReceipt()

  // ------------------------------------------------------------ vault + draft
  const [vault, setVaultState] = useState<Profile>(loadVault)
  const setVault = (p: Profile) => {
    setVaultState(p)
    saveVault(p)
  }
  const [draft, setDraftState] = useState<string>(loadDraft)
  const setDraft = (d: string) => {
    setDraftState(d)
    saveDraft(d)
  }
  const [undo, setUndo] = useState<string | null>(null)
  const typeDraft = (d: string) => {
    setUndo(null)
    setDraft(d)
  }
  const [earlier, setEarlier] = useState<string[]>([])
  const earlierPosts = earlier.map((p) => p.trim()).filter(Boolean)
  const [warmKey, setWarmKey] = useState(0)
  const [sampleId, setSampleId] = useState<string | null>(null)

  // A sample stays a sample while it is still recognisably the sample.
  const sample = SAMPLES.find((s) => s.id === sampleId) ?? null
  const isSample = useMemo(() => {
    if (!sample) return false
    const base = new Set(contentWords(sample.draft))
    const now = contentWords(draft)
    if (!now.length) return false
    return now.filter((w) => base.has(w)).length / now.length >= 0.6
  }, [sample, draft])

  // ------------------------------------------------------------ giveaways
  const [aiScan, setAiScan] = useState<{ items: ModelTell[]; source: Source; forDraft: string } | null>(null)
  const [scan, setScan] = useState<{ status: 'idle' | 'running' | 'error'; error?: string }>({ status: 'idle' })

  const [runs, setRuns] = useState<Run[]>([])
  const lastRun = runs.at(-1) ?? null

  const rules = useMemo(() => ruleTells(draft), [draft])
  const fromModel = useMemo(() => (aiScan ? modelTells(draft, aiScan.items, aiScan.source) : []), [draft, aiScan])
  const cited = useMemo(
    () => (lastRun ? evidenceTells(draft, lastRun.report.guesses, settings.minConfidence) : []),
    [draft, lastRun, settings.minConfidence],
  )
  const tells = useMemo(() => withHeat(combineTells(draft, rules, fromModel, cited), cited), [draft, rules, fromModel, cited])

  const scanNow = async () => {
    if (!isConfigured || draft.trim().length < 20) return
    const forDraft = draft
    setScan({ status: 'running' })
    try {
      const r = await findTells(forDraft, vault, settings)
      const items: ModelTell[] = r.tells.map((t) => ({ quote: t.text, kind: t.kind, why: t.why, risk: t.risk }))
      setAiScan({ items, source: r.source, forDraft })
      setScan({ status: 'idle' })
    } catch (e) {
      setScan({ status: 'error', error: friendly(e) })
    }
  }

  // With Gemini Nano ready, scan automatically once typing pauses. It's free
  // and offline, so there's no reason to wait for a click.
  useEffect(() => {
    if (!deviceReady || !isConfigured || draft.trim().length < 40 || aiScan?.forDraft === draft) return
    const t = setTimeout(scanNow, 1400)
    return () => clearTimeout(t)
    // scanNow reads the latest draft; re-running on draft changes is enough.
  }, [deviceReady, draft, aiScan?.forDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------ focus
  const [focus, setFocus] = useState<{ start: number; end: number; nonce: number } | null>(null)
  const pointAt = (start: number, end: number) => setFocus((f) => ({ start, end, nonce: (f?.nonce ?? 0) + 1 }))
  const pointAtQuote = (q: string) => {
    const at = locate(draft, q)
    if (at >= 0) pointAt(at, at + q.trim().length)
  }

  // ------------------------------------------------------------ detective
  const [det, setDet] = useState<DetectiveState>({ status: 'idle' })
  const [confirmed, setConfirmed] = useState(false)
  const [crossing, setCrossing] = useState<'out' | 'back' | null>(null)
  const [fixesSinceRun, setFixesSinceRun] = useState(0)
  const reportRef = useRef<HTMLDivElement>(null)

  const words = wordCount(draft)
  const vaultFacts = ATTRIBUTES.filter((a) => (vault[a] ?? '').trim()).length
  const blocker = !isConfigured
    ? 'Firebase isn’t connected in this copy, so the detective can’t run. The README explains the setup.'
    : !online
      ? 'You’re offline. The detective needs the cloud; the giveaway scan keeps working on this device.'
      : words < MIN_WORDS
        ? `Write a little more first. The detective needs at least ${MIN_WORDS} words.`
        : null

  const sendDetective = async () => {
    if (blocker) return
    const startedAt = now()
    const forDraft = draft
    setDet({ status: 'running', startedAt, phase: 'detective' })
    setCrossing('out')
    try {
      const report = await runDetective(forDraft, vault, settings)
      setCrossing('back')
      let historyReport = null
      if (earlierPosts.length) {
        setDet({ status: 'running', startedAt, phase: 'history' })
        setCrossing('out')
        historyReport = await runDetective(forDraft, vault, settings, earlierPosts)
        setCrossing('back')
      }
      setDet({ status: 'running', startedAt, phase: 'grading' })
      const grade = async (r: typeof report): Promise<RunView> => {
        const grades = await gradePrivately(r.guesses, vault, settings, deviceReady)
        return { report: r, grades, exposure: exposure(grades, r.guesses, settings.minConfidence, vault) }
      }
      const alone = await grade(report)
      const history = historyReport ? { ...(await grade(historyReport)), posts: earlierPosts.length } : undefined
      const at = now()
      setRuns((rs) => [...rs, { ...alone, id: at, at, draft: forDraft, fixesBefore: fixesSinceRun, history }])
      setFixesSinceRun(0)
      setFix(null)
      setMeaning(null)
      setScope('alone')
      setDet({ status: 'idle' })
      setCrossing(null)
      if (share) shareCounts(tells).then(refreshCounts).catch(() => {})
      requestAnimationFrame(() => reportRef.current?.scrollIntoView({ block: 'start', behavior: smooth() }))
    } catch (e) {
      setCrossing(null)
      setDet({ status: 'error', error: friendly(e) })
    }
  }

  const override = (attribute: Attribute, verdict: Verdict, scope: 'alone' | 'history') => {
    setRuns((rs) =>
      rs.map((r, i) => {
        if (i !== rs.length - 1) return r
        const target: RunView = scope === 'history' && r.history ? r.history : r
        const grades: Grade[] = target.grades.some((g) => g.attribute === attribute)
          ? target.grades.map((g) => (g.attribute === attribute ? { ...g, verdict, by: 'you' as const } : g))
          : [...target.grades, { attribute, verdict, by: 'you' as const }]
        const updated = { ...target, grades, exposure: exposure(grades, target.report.guesses, settings.minConfidence, vault) }
        return scope === 'history' && r.history ? { ...r, history: { ...r.history, ...updated } } : { ...r, ...updated }
      }),
    )
  }

  // ------------------------------------------------------------ fixes
  const [fix, setFix] = useState<FixState | null>(null)
  const [meaning, setMeaning] = useState<MeaningState>(null)
  const [copied, setCopied] = useState(false)
  const fixesRef = useRef<HTMLDivElement>(null)

  const copyPost = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      toast('Post copied. Paste it wherever you’re posting.')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast('Couldn’t reach the clipboard. Select the text in the editor and copy it.')
    }
  }

  // "Blur it": an instant, deterministic rewrite on this device.
  const quickBlur = (t: { start: number; end: number; text: string }) => {
    const b = blurSpan(draft, t)
    if (!b) return
    const before = draft
    setUndo(before)
    setDraft(replaceSpan(draft, b.start, b.end, b.replacement))
    setFixesSinceRun((n) => n + 1)
    toast(b.replacement ? `Blurred “${t.text}” to “${b.replacement}”` : `Removed “${t.text}”`, {
      label: 'Undo',
      run: () => {
        setDraft(before)
        setUndo(null)
        setFixesSinceRun((n) => Math.max(0, n - 1))
      },
    })
  }

  const coolDown = async () => {
    if (!lastRun) return
    setFix({ status: 'loading' })
    setMeaning(null)
    requestAnimationFrame(() => fixesRef.current?.scrollIntoView({ block: 'center', behavior: smooth() }))
    const clues = cluesToRewrite(draft, tells, lastRun.report.guesses, settings.minConfidence)
    try {
      const r = await suggestFixes(draft, clues, vault, settings)
      setFix({ status: 'ready', fixes: r.fixes, source: r.source })
    } catch (e) {
      setFix({ status: 'error', error: friendly(e) })
    }
  }

  const applyChosen = async () => {
    if (fix?.status !== 'ready') return
    const chosen = fix.fixes.filter((f) => f.accepted)
    const original = draft
    const next = applyFixes(draft, fix.fixes)
    setDraft(next)
    setFix({ status: 'applied', count: chosen.length, source: fix.source })
    setFixesSinceRun((n) => n + chosen.length)
    if (!settings.meaningCheck) return
    setMeaning({ status: 'loading' })
    const result = await checkMeaning(original, next, chosen.map((f) => f.original), settings, deviceReady)
    setMeaning({ status: 'ready', result })
  }

  // ------------------------------------------------------------ device model
  const [progress, setProgress] = useState<number | null>(null)
  const download = async () => {
    try {
      setProgress(0)
      await prepareDeviceModel(settings.fastModel, setProgress)
    } catch {
      // Chrome reports the reason through availability(); the status chip shows it.
    } finally {
      setProgress(null)
      recheckDevice()
    }
  }

  // ------------------------------------------------------------ receipt, sharing
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [fwTest, setFwTest] = useState<FirewallTestResult | null>(null)
  const publicText = [draft, ...earlierPosts, ...runs.map((r) => r.draft)].join('\n')
  const audit = useMemo(() => auditRecords(records, vault, publicText), [records, vault, publicText])

  const [share, setShare] = useState(loadShareChoice)
  const [counts, setCounts] = useState<Counts | null>(null)
  const refreshCounts = () => readCounts().then(setCounts)
  useEffect(() => {
    readCounts().then(setCounts)
  }, [])

  // ------------------------------------------------------------ actions
  const loadSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id)
    if (!s) return
    setSampleId(id)
    setDraft(s.draft)
    setVault(s.vault)
    setEarlier([])
    setRuns([])
    setFix(null)
    setMeaning(null)
    setAiScan(null)
    setDet({ status: 'idle' })
    setFixesSinceRun(0)
    setWarmKey((k) => k + 1)
  }

  const forget = () => {
    forgetEverything()
    setVaultState({})
    setDraftState('')
    setEarlier([])
    setRuns([])
    setFix(null)
    setMeaning(null)
    setAiScan(null)
    setSampleId(null)
    setConfirmed(false)
    setShare(false)
    setFwTest(null)
  }

  const blankFacts: Fact[] = ATTRIBUTES.map((attribute) => ({
    attribute,
    status: (vault[attribute] ?? '').trim() ? 'safe' : 'empty',
  }))

  const [scope, setScope] = useState<'alone' | 'history'>('alone')
  const [hoverFact, setHoverFact] = useState<Attribute | null>(null)
  const splitRef = useRef<HTMLElement>(null)
  const shownView = lastRun ? (scope === 'history' && lastRun.history ? lastRun.history : lastRun) : null
  const threadLinks: Link[] = shownView
    ? shownView.exposure.facts.filter((f) => f.status === 'recovered' || f.status === 'narrowed').map((f) => ({ attribute: f.attribute, status: f.status }))
    : []

  const graderLabel = lastRun?.grades.some((g) => g.by === 'on_device') ? 'Gemini Nano' : 'rules'

  const current = lastRun && lastRun.draft === draft ? lastRun.exposure : null
  const hint = coach({
    draft,
    words,
    tells,
    running: det.status === 'running',
    online,
    current,
    first: runs[0]?.exposure.score ?? null,
    runs: runs.length,
    fixesPending: fixesSinceRun,
  })
  const foundBy =
    aiScan && aiScan.forDraft === draft ? (aiScan.source === 'on_device' ? 'Scanned by Gemini Nano on this device' : 'Deep-scanned in the cloud') : 'Found by rules on this device'
  const scanFooter =
    scan.status === 'running' ? (
      <span className="pulse">{deviceReady ? 'Gemini Nano is reading your draft' : 'Scanning in the cloud'}</span>
    ) : (
      <>
        {scan.status === 'error' ? <span className="vf-error">{scan.error}</span> : tells.length ? <span className="hide-sm">{foundBy}</span> : null}
        <span className="vf-words">
          {words} {words === 1 ? 'word' : 'words'}
        </span>
        {undo != null ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setDraft(undo)
              setUndo(null)
              setFixesSinceRun((n) => Math.max(0, n - 1))
            }}
          >
            Undo blur
          </button>
        ) : null}
        {!deviceReady && isConfigured && online && draft.trim().length >= 20 && aiScan?.forDraft !== draft ? (
          <button type="button" className="btn btn-sm" onClick={scanNow} data-tip="One extra pass by a fast cloud model. Your vault isn’t sent." data-tip-align="end">
            Deep scan
          </button>
        ) : null}
      </>
    )

  return (
    <div className="app">
      <Header
        online={online}
        device={device}
        cloudCalls={audit.inCloud}
        vaultValuesSent={audit.vaultValuesSent}
        theme={theme}
        onTheme={setTheme}
        onHowItWorks={() => setHowOpen(true)}
        onReceipt={() => setReceiptOpen(true)}
      />

      <main className="workspace" ref={splitRef}>
        <Threads container={splitRef} links={threadLinks} active={hoverFact} version={`${lastRun?.id ?? 0}|${scope}|${det.status}|${fix?.status ?? ''}|${draft}`} />
        <div className="pane pane-device">
          <div className="pane-bar">
            <div className="pane-bar-inner">
              <span className="pane-label">
                <LockIcon /> This device
              </span>
              <span className="pane-meta">Your vault and your checks stay here</span>
            </div>
          </div>
          <div className="pane-body">
            <div className="intro">
              <h1 className="title">Your account is anonymous. Is your post?</h1>
              <p className="lede">
                Before you post on Reddit, Glassdoor or a staff forum, check what your words give away. Who you really are stays in
                this browser, where it’s used to check the detective’s guesses.
              </p>
            </div>

            <div className="samples" role="group" aria-label="Sample stories">
              <span className="samples-label">Try a sample</span>
              <div className="segmented">
                {SAMPLES.map((s) => (
                  <button key={s.id} type="button" aria-pressed={sampleId === s.id && isSample} onClick={() => loadSample(s.id)}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <p className={`hint tone-${hint.tone}`} role="status" aria-live="polite">
                {hint.tone === 'good' ? <Nobody className="hint-nobody" wave look={{ x: 0.4, y: -0.4 }} /> : <InfoIcon />}
                <span>{hint.says}</span>
              </p>
              <Viewfinder
                draft={draft}
                onChange={typeDraft}
                onSubmit={() => {
                  if (!blocker && (confirmed || isSample) && det.status !== 'running') sendDetective()
                }}
                tells={tells}
                focus={focus}
                warmKey={warmKey}
                linked={hoverFact}
                footer={scanFooter}
              />
            </div>

            <Giveaways tells={tells} onPick={(t) => pointAt(t.start, t.end)} blurOf={(t) => blurSpan(draft, t)?.replacement ?? null} onBlur={quickBlur} />

            {fix ? (
              <div ref={fixesRef}>
                <Fixes
                  state={fix}
                  meaning={meaning}
                  onToggle={(i) =>
                    setFix((f) => (f?.status === 'ready' ? { ...f, fixes: f.fixes.map((x, j) => (j === i ? { ...x, accepted: !x.accepted } : x)) } : f))
                  }
                  onApply={applyChosen}
                  onCopy={copyPost}
                  copied={copied}
                  onRetest={sendDetective}
                  onRetry={coolDown}
                  onClose={() => setFix(null)}
                />
              </div>
            ) : null}

            <EarlierPosts posts={earlier} onChange={setEarlier} />

            <Vault vault={vault} onChange={setVault} device={device} progress={progress} canDownload={isConfigured} onDownload={download} onForget={forget} />
          </div>
        </div>

        <Seam vaultValuesSent={audit.vaultValuesSent} blocked={audit.blocked} crossing={crossing} onOpenReceipt={() => setReceiptOpen(true)} />

        <div className="pane pane-cloud">
          <div className="pane-bar">
            <div className="pane-bar-inner">
              <span className="pane-label">
                <CloudIcon /> Cloud
              </span>
              <span className="pane-meta mono">{lastRun?.report.model ?? settings.detectiveModel}</span>
            </div>
          </div>
          <div className="pane-body">
            <Detective
              state={det}
              words={words}
              vaultFacts={vaultFacts}
              earlierPosts={earlierPosts.length}
              confirmed={confirmed || isSample}
              sample={isSample}
              onConfirm={setConfirmed}
              onSend={sendDetective}
              blocker={blocker}
              hasRuns={runs.length > 0}
              blankFacts={blankFacts}
            />
            {lastRun ? (
              <div ref={reportRef} className="report-anchor">
                <Report
                  key={lastRun.id}
                  run={lastRun}
                  scope={scope}
                  onScope={setScope}
                  onHoverFact={setHoverFact}
                  draft={draft}
                  graderLabel={graderLabel}
                  onEvidence={pointAtQuote}
                  onOverride={override}
                  onCoolDown={coolDown}
                  coolingDisabled={fix?.status === 'loading'}
                />
              </div>
            ) : null}
            <Runs runs={runs} />
            {runs.length ? <BeforeYouPost key={runs[0].id} score={current ? current.score : null} onCopy={copyPost} copied={copied} /> : null}
          </div>
        </div>
      </main>

      <Footer
        share={share}
        onShare={(v) => {
          setShare(v)
          saveShareChoice(v)
        }}
        counts={counts}
        configured={isConfigured}
      />

      <Receipt
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        records={records}
        audit={audit}
        firewallTest={fwTest}
        onFirewallTest={async () => setFwTest(await testFirewall(vault, publicText))}
      />
      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
      <Toaster />
    </div>
  )
}

function smooth(): ScrollBehavior {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
