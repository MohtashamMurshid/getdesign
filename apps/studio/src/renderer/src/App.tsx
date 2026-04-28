import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app">
      <h1>getdesign Studio</h1>
      <p>Electron + React + Vite + TypeScript</p>
      <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>
    </main>
  );
}
