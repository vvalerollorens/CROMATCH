"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <h1>No hemos podido cargar la página</h1>
      <p>Comprueba tu conexión e inténtalo otra vez.</p>
      <button onClick={reset}>Reintentar</button>
      <a href="/">Volver al inicio</a>
    </main>
  );
}
