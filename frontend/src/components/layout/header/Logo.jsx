function Logo({ onHome }) {
  return (
    <button
      onClick={onHome}
      className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
      aria-label="Locus — início"
    >
      <span
        className="flex items-center leading-none gap-1"
        style={{ fontFamily: 'Cinzel, Georgia, serif' }}
      >
        {/* <h1 className="m-0 text-5xl md:text-7xl font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>L</h1> 
        <h1 className="m-0 text-3xl md:text-5xl font-semibold" style={{ color: 'var(--cor-texto)' }}>ocus</h1> */}
        <img src={`${import.meta.env.BASE_URL}./public/new-img/locus.png`} alt="" className="h-20 w-40 object-cover" />

      </span>
    </button>
  )
}

export default Logo
