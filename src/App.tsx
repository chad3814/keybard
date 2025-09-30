import { VialProvider } from './contexts/VialContext';
import KeyboardConnector from './components/KeyboardConnector';
import './App.css';

function App() {
  return (
    <VialProvider>
      <div className="App">
        <header className="App-header">
          <h1>KeyBard - Vite + React + TypeScript</h1>
        </header>
        <main>
          <KeyboardConnector />
        </main>
      </div>
    </VialProvider>
  );
}

export default App;