export default function ErrorMessage({ message, onRetry, className = '' }) {
  if (!message) return null

  return (
    <div className={`rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 ${className}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-red-400">⚠</span>
        <div className="flex-1">
          <p>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
