// The OneOfMany mark: nine identical people, one of them you.

export function Mark({ size = 28 }: { size?: number }) {
  const dots = [
    [9, 9],
    [16, 9],
    [23, 9],
    [9, 16],
    [23, 16],
    [9, 23],
    [16, 23],
    [23, 23],
  ]
  return (
    <svg className="mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="currentColor" opacity="0.55" />
      ))}
      <circle className="mark-you" cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  )
}
