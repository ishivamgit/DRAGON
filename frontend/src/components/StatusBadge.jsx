export default function StatusBadge({ status, className = '' }) {
  const config = {
    upcoming: {
      label: 'Upcoming',
      classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      dot: 'bg-blue-400',
    },
    active: {
      label: 'Active',
      classes: 'bg-green-500/15 text-green-400 border-green-500/30',
      dot: 'bg-green-400 animate-pulse',
    },
    completed: {
      label: 'Completed',
      classes: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
      dot: 'bg-gray-400',
    },
    cancelled: {
      label: 'Cancelled',
      classes: 'bg-red-500/15 text-red-400 border-red-500/30',
      dot: 'bg-red-400',
    },
    draft: {
      label: 'Draft',
      classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      dot: 'bg-yellow-400',
    },
  }

  const cfg = config[status?.toLowerCase()] || config.draft

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
