// One Firebase AI Logic model instance per job, each with its own inference
// mode. The mode is a privacy decision, not just a performance one:
//
//   lint      PREFER_ON_DEVICE  draft only (it is about to be public anyway)
//   rewrite   PREFER_ON_DEVICE  draft + clues chosen without the profile
//   grade     ONLY_ON_DEVICE    contains the private profile, never leaves
//   detective ONLY_IN_CLOUD     strongest model + Google Search, draft only

import { getGenerativeModel, InferenceMode, ThinkingLevel, type GenerativeModel, type Tool } from 'firebase/ai'
import { firebase } from '../firebase'
import { DEVICE_OPTIONS } from './device'
import type { JsonSchema } from './schemas'
import type { Routing } from './receipt'

type Mode = (typeof InferenceMode)[keyof typeof InferenceMode]

const ROUTING_TO_MODE: Record<Routing, Mode> = {
  device_only: InferenceMode.ONLY_ON_DEVICE,
  device_first: InferenceMode.PREFER_ON_DEVICE,
  cloud_only: InferenceMode.ONLY_IN_CLOUD,
}

const cache = new Map<string, GenerativeModel>()

export interface ModelSpec {
  job: string
  routing: Routing
  cloudModel: string
  schema?: JsonSchema
  tools?: Tool[]
  temperature?: number
  /** Ask the cloud model to think less, for latency. */
  lowThinking?: boolean
}

export function modelFor(spec: ModelSpec): GenerativeModel {
  const key = `${spec.job}|${spec.routing}|${spec.cloudModel}|${spec.tools ? 'tools' : ''}|${spec.lowThinking ? 'low' : ''}`
  const hit = cache.get(key)
  if (hit) return hit
  const { ai } = firebase()
  const thinkingConfig = spec.lowThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}
  const generationConfig = spec.schema
    ? { responseMimeType: 'application/json', responseJsonSchema: spec.schema, temperature: spec.temperature, ...thinkingConfig }
    : { temperature: spec.temperature, ...thinkingConfig }
  const model = getGenerativeModel(ai, {
    mode: ROUTING_TO_MODE[spec.routing],
    inCloudParams: { model: spec.cloudModel, generationConfig, tools: spec.tools },
    onDeviceParams: {
      createOptions: { ...DEVICE_OPTIONS } as never,
      promptOptions: spec.schema ? { responseConstraint: spec.schema } : undefined,
    },
  })
  cache.set(key, model)
  return model
}

/**
 * Starts (or resumes) the on-device model download. Chrome requires this to
 * follow a user gesture, so it is wired to a button.
 */
export async function prepareDeviceModel(cloudModel: string, onProgress: (p: number) => void): Promise<void> {
  const m = modelFor({ job: 'warmup', routing: 'device_first', cloudModel })
  await m.initializeDeviceModel(onProgress)
}
