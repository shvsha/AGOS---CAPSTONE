export function SpinnerIcon({ size = 23, color = '#1565BC' }: { size?: number, color?: string }) {
  return (
    <div
      style={{ width: size, height: size, borderColor: `${color}40`, borderTopColor: color }}
      className="rounded-full border-[3px] animate-spin"
    />
  )
}