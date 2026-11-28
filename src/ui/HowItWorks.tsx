// Two lanes and a wall: what runs on the device, what runs in the cloud, and
// why each job sits where it does.

import { useEffect, useRef } from 'react'
import { ChipIcon, CloseIcon, CloudIcon, ShieldIcon } from './icons'

const JOBS = [
  {
    job: 'Find giveaways as you type',
    mode: 'PREFER_ON_DEVICE',
    why: 'Runs on every pause, so it has to be free and work offline. It reads only the draft you’re about to publish.',
  },
  {
    job: 'Play the detective',
    mode: 'ONLY_IN_CLOUD',
    why: 'Needs the strongest model, and the web when it’s available. It must not know the answer, so it never gets the vault.',
  },
  {
    job: 'Grade the guesses',
    mode: 'ONLY_ON_DEVICE',
    why: 'The prompt contains your vault. No cloud fallback: without Gemini Nano, deterministic rules grade instead.',
  },
  {
    job: 'Suggest rewrites',
    mode: 'PREFER_ON_DEVICE',
    why: 'Clues are chosen from the detective’s evidence, not the vault, so a cloud fallback learns nothing new.',
  },
  {
    job: 'Check the meaning survived',
    mode: 'ONLY_ON_DEVICE',
    why: 'Compares your original with the rewrite. The original holds the clues you chose not to publish.',
  },
]

export function HowItWorks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby="how-title" onClick={(e) => e.target === ref.current && onClose()}>
      <header className="dialog-head">
        <h2 id="how-title" className="dialog-title">
          How OneOfMany works
        </h2>
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </header>
      <div className="dialog-body">
        <p className="odyssey">
          The name comes from the Odyssey. Odysseus tells the one-eyed Cyclops that his name is Nobody, then slips out of the cave
          hidden among the flock. OneOfMany does the same for your post: the cloud detective gets your words, never your name, and
          you leave as one of many.
        </p>

        <p>
          The test only means something if the attacker doesn’t know the answer, and only your device may hold the answer. So the
          split between device and cloud isn’t an optimisation here. It’s the security design.
        </p>

        <div className="lanes">
          <div className="lane lane-device">
            <h3>
              <ChipIcon /> On your device
            </h3>
            <ul>
              <li>Your vault: who you really are</li>
              <li>Gemini Nano finds giveaways as you type</li>
              <li>Gemini Nano grades the detective’s guesses</li>
              <li>Gemini Nano rewrites the clues</li>
              <li>Gemini Nano checks the meaning survived</li>
            </ul>
          </div>
          <div className="lane-wall">
            <ShieldIcon />
            <span>Firewall</span>
          </div>
          <div className="lane lane-cloud">
            <h3>
              <CloudIcon /> In the cloud
            </h3>
            <ul>
              <li>The detective reads only your post</li>
              <li>It guesses ten facts about you, with quotes as evidence</li>
              <li>With web search available, it checks places and teams online</li>
            </ul>
          </div>
        </div>

        <p>
          Before any request that could reach the cloud is sent, the firewall checks it for every vault value that isn’t already in
          your post. If it finds one, the request is blocked. The cloud receipt then re-checks everything that actually went out.
        </p>

        <table className="jobs">
          <caption>Every AI job goes through Firebase AI Logic</caption>
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Inference mode</th>
              <th scope="col">Why there</th>
            </tr>
          </thead>
          <tbody>
            {JOBS.map((j) => (
              <tr key={j.job}>
                <th scope="row">{j.job}</th>
                <td>
                  <code>{j.mode}</code>
                </td>
                <td>{j.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </dialog>
  )
}
