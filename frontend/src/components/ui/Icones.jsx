function Icone({ children, className = "w-4 h-4", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const Estrela = (props) => (
  <Icone {...props}>
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </Icone>
);

export const Download = (props) => (
  <Icone {...props}>
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </Icone>
);

export const Check = (props) => (
  <Icone {...props}>
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </Icone>
);

export const Relogio = (props) => (
  <Icone {...props}>
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </Icone>
);

export const Camada = (props) => (
  <Icone {...props}>
    <path d="M12 2 2 8v8l10 6 10-6V8L12 2zm0 2.2 6.76 4.05L12 12.3 5.24 8.25 12 4.2zM4 10.35l8 4.8 8-4.8V14.5l-8 4.8-8-4.8v-4.15z" />
  </Icone>
);

export const SetaEsquerda = (props) => (
  <Icone {...props}>
    <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H19v-2z" />
  </Icone>
);

export const Carrinho = (props) => (
  <Icone {...props}>
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
  </Icone>
);
