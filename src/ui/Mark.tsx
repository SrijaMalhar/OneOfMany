// The OneOfMany mark: nine identical people, one of them you.

export function Mark({ size = 20 }: { size?: number }) {
  const dots = [
    [7, 7],
    [16, 7],
    [25, 7],
    [7, 16],
    [25, 16],
    [7, 25],
    [16, 25],
    [25, 25],
  ]
  return (
    <svg className="mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" opacity="0.38" />
      ))}
      <circle className="mark-you" cx="16" cy="16" r="3.4" />
    </svg>
  )
}
