import { describe, expect, it } from 'vitest'
import { platformOf } from './platform'

describe('platform of a sample', () => {
  it('reads subreddits and named sites', () => {
    expect(platformOf('r/nursing')).toBe('reddit')
    expect(platformOf('Glassdoor review')).toBe('glassdoor')
    expect(platformOf('Blind')).toBe('blind')
    expect(platformOf('the staff Slack')).toBe('internal')
  })

  it('leaves the choice to the user otherwise', () => {
    expect(platformOf(undefined)).toBeUndefined()
    expect(platformOf('a blog')).toBeUndefined()
  })
})
