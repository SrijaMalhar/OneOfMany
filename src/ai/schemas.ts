// JSON Schemas shared by both paths: the same object is passed to Chrome's
// Prompt API as `responseConstraint` (on-device) and to Gemini as
// `responseJsonSchema` (cloud). Kept to the subset both understand.

import { ATTRIBUTES, TELL_KINDS } from '../types'

export const TELLS_SCHEMA = {
  type: 'object',
  properties: {
    tells: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          quote: { type: 'string' },
          kind: { type: 'string', enum: [...TELL_KINDS] },
          why: { type: 'string' },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['quote', 'kind', 'why', 'risk'],
      },
    },
  },
  required: ['tells'],
} as const

export const DETECTIVE_SCHEMA = {
  type: 'object',
  properties: {
    guesses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          attribute: { type: 'string', enum: [...ATTRIBUTES] },
          guess: { type: 'string' },
          confidence: { type: 'integer' },
          evidence: { type: 'array', items: { type: 'string' } },
          reasoning: { type: 'string' },
        },
        required: ['attribute', 'guess', 'confidence', 'evidence', 'reasoning'],
      },
    },
    crowdSize: { type: 'string' },
    nextStep: { type: 'string' },
  },
  required: ['guesses', 'crowdSize', 'nextStep'],
} as const

export const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    grades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          attribute: { type: 'string', enum: [...ATTRIBUTES] },
          verdict: { type: 'string', enum: ['exact', 'close', 'wrong'] },
        },
        required: ['attribute', 'verdict'],
      },
    },
  },
  required: ['grades'],
} as const

export const FIX_SCHEMA = {
  type: 'object',
  properties: {
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          replacement: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['original', 'replacement', 'reason'],
      },
    },
  },
  required: ['fixes'],
} as const

export type JsonSchema = Record<string, unknown>

export const MEANING_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    verdict: { type: 'string' },
    lost: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'verdict', 'lost'],
} as const
