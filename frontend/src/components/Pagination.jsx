export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)

  for (let i = left; i <= right; i++) {
    pages.push(i)
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-dragon-purple/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        ‹
      </button>

      {left > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm text-gray-400 transition-colors hover:border-dragon-purple/50 hover:text-white"
          >
            1
          </button>
          {left > 2 && <span className="px-1 text-gray-600">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
            p === page
              ? 'border-dragon-purple bg-dragon-purple text-white'
              : 'border-white/10 text-gray-400 hover:border-dragon-purple/50 hover:text-white'
          }`}
        >
          {p}
        </button>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="px-1 text-gray-600">…</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm text-gray-400 transition-colors hover:border-dragon-purple/50 hover:text-white"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-dragon-purple/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}
