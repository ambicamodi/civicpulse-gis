import MapView from "./MapView";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>CivicPulse</h1>
          <p>GIS & Civic Issue Intelligence</p>
        </div>

        <div className="header-badge">
          LIVE PROTOTYPE
        </div>
      </header>

      <main className="main-content">
        <MapView />
      </main>
    </div>
  );
}

export default App;