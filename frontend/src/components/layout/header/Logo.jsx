function Logo({ onHome }) {
  return (
    <button
      onClick={onHome}
      className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
      aria-label="Lume — início"
    >
      <span
        className="flex items-center leading-none gap-1"
        style={{ fontFamily: 'Cinzel, Georgia, serif' }}
      >
        <img src={`${import.meta.env.BASE_URL}./public/IDENTIDADE VISUAL LOCUS/locus-png.png`} alt="Locus" className="h-20 w-60 object-cover" />
      </span>
    </button>
  )
}

export default Logo
