// On-device model status, read straight from Chrome's Prompt API so the UI can
// tell the user exactly what this device can do before any request is made.

export type DeviceStatus = 'checking' | 'unsupported' | 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface LanguageModelStatic {
  availability(options?: unknown): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>
}

export const DEVICE_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
}

export async function readDeviceStatus(): Promise<DeviceStatus> {
  const LM = (globalThis as unknown as { LanguageModel?: LanguageModelStatic }).LanguageModel
  if (!LM) return 'unsupported'
  try {
    return await LM.availability(DEVICE_OPTIONS)
  } catch {
    return 'unavailable'
  }
}

export const DEVICE_STATUS_TEXT: Record<DeviceStatus, string> = {
  checking: 'Checking this device',
  unsupported: 'No on-device model in this browser',
  unavailable: 'This device can’t run Gemini Nano',
  downloadable: 'Gemini Nano can be downloaded',
  downloading: 'Downloading Gemini Nano',
  available: 'Gemini Nano ready',
}
