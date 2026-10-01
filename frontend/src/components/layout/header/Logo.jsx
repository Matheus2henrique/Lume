function Logo({ onHome }) {
  return (
    <button
      onClick={onHome}
      className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
      aria-label="Lume — início"
    >
      <span
        className="flex items-center leading-none"
        style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}nome.jpeg`}
          alt=""
          className="h-15 w-15 md:h-24 md:w-24 rounded-full object-cover mx-0.5"
        />
      </span>
    </button>
  )
}

export default Logo
