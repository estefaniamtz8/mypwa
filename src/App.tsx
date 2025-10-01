import { useState } from "react";
import Splash from "./components/Splash";
import "./styles.css";

function Home() {
  return (
    <main className="home">
      <h2>Bienvenido</h2>
      <p> Soluciones que transforman (Home)</p>
    </main>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <Splash onFinish={() => setReady(true)} />}
      {ready && <Home />}
    </>
  );
}
