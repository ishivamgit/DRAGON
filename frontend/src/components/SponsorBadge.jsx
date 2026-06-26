export default function SponsorBadge({ sponsor, size = 'sm', className = '' }) {
  if (!sponsor) return null

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-dragon-amber/10 border border-dragon-amber/30 text-dragon-amber font-medium ${sizes[size]} ${className}`}
    >
      {sponsor.logo_url ? (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="h-3 w-3 rounded-full object-cover"
        />
      ) : (
        <span className="text-dragon-amber">★</span>
      )}
      {sponsor.name}
    </span>
  )
}
