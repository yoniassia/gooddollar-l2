'use client'

export function StartSwappingCTA() {
  const handleClick = () => {
    const card = document.getElementById('swap-card')
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        const input = card.querySelector<HTMLInputElement>('input[inputmode="decimal"]')
        input?.focus()
      }, 500)
    }
  }

  return (
    <div className="mt-10 mb-2 flex justify-center">
      <button
        onClick={handleClick}
        className="group px-8 py-3 rounded-full bg-goodgreen text-dark font-semibold text-sm hover:bg-goodgreen/90 transition-colors shadow-lg shadow-goodgreen/20"
      >
        Start Swapping
        <span className="inline-block ml-1.5 transition-transform group-hover:translate-x-0.5">&rarr;</span>
      </button>
    </div>
  )
}
