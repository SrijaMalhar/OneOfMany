// Firebase wiring: App, App Check (required by AI Logic), AI Logic, Auth,
// Firestore and Remote Config. Config comes from Vite env vars so no keys
// live in the repository.
//
// Every env var is read as `import.meta.env.X` directly (never through an
// alias object) so that Vite inlines only the values used, and the App Check
// debug token is referenced only inside an `import.meta.env.DEV` branch. A
// production build therefore never contains the debug token, even when it
// sits in .env.local on the machine that runs `npm run deploy`.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check'
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { fetchAndActivate, getRemoteConfig, getValue, type RemoteConfig } from 'firebase/remote-config'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const ENTERPRISE_KEY = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
const V3_KEY = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY as string | undefined

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
export const hasAppCheck = Boolean(ENTERPRISE_KEY || V3_KEY)

/** Remote Config defaults. Every value can be tuned live from the console. */
export const RC_DEFAULTS = {
  detective_model: 'gemini-3.8-flash',
  fast_model: 'gemini-3.5-flash-lite',
  detective_use_search: true,
  min_confidence: 50,
  detective_prompt_version: 'v1',
  meaning_check: true,
} as const

export type Settings = {
  detectiveModel: string
  fastModel: string
  useSearch: boolean
  minConfidence: number
  promptVersion: string
  meaningCheck: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  detectiveModel: RC_DEFAULTS.detective_model,
  fastModel: RC_DEFAULTS.fast_model,
  useSearch: RC_DEFAULTS.detective_use_search,
  minConfidence: RC_DEFAULTS.min_confidence,
  promptVersion: RC_DEFAULTS.detective_prompt_version,
  meaningCheck: RC_DEFAULTS.meaning_check,
}

let app: FirebaseApp | undefined
let appCheck: AppCheck | undefined
let ai: AI | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let rc: RemoteConfig | undefined

export function firebase() {
  if (!isConfigured) throw new Error('Firebase is not configured. Copy .env.example to .env.local and fill it in.')
  if (!app) {
    app = initializeApp(firebaseConfig)

    // App Check protects the Gemini API from abuse. In development a debug
    // token is used; register it in the Firebase console (never commit it).
    if (import.meta.env.DEV) {
      ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined) || true
    }
    if (ENTERPRISE_KEY || V3_KEY) {
      appCheck = initializeAppCheck(app, {
        provider: ENTERPRISE_KEY ? new ReCaptchaEnterpriseProvider(ENTERPRISE_KEY) : new ReCaptchaV3Provider(V3_KEY!),
        isTokenAutoRefreshEnabled: true,
      })
    }

    ai = getAI(app, { backend: new GoogleAIBackend() })
    auth = getAuth(app)
    db = getFirestore(app)
    rc = getRemoteConfig(app)
    rc.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 3_600_000
    rc.defaultConfig = { ...RC_DEFAULTS }
  }
  return { app: app!, appCheck, ai: ai!, auth: auth!, db: db!, rc: rc! }
}

/** Fetches Remote Config, but never waits more than 2.5 s; defaults work offline. */
export async function loadSettings(): Promise<Settings> {
  if (!isConfigured) return DEFAULT_SETTINGS
  try {
    const { rc } = firebase()
    await Promise.race([fetchAndActivate(rc), new Promise((r) => setTimeout(r, 2500))])
    return {
      detectiveModel: getValue(rc, 'detective_model').asString() || DEFAULT_SETTINGS.detectiveModel,
      fastModel: getValue(rc, 'fast_model').asString() || DEFAULT_SETTINGS.fastModel,
      useSearch: getValue(rc, 'detective_use_search').asBoolean(),
      minConfidence: getValue(rc, 'min_confidence').asNumber() || DEFAULT_SETTINGS.minConfidence,
      promptVersion: getValue(rc, 'detective_prompt_version').asString() || DEFAULT_SETTINGS.promptVersion,
      meaningCheck: getValue(rc, 'meaning_check').asBoolean(),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function ensureSignedIn(): Promise<string | null> {
  if (!isConfigured) return null
  const { auth } = firebase()
  if (auth.currentUser) return auth.currentUser.uid
  try {
    const cred = await signInAnonymously(auth)
    return cred.user.uid
  } catch {
    return null
  }
}
