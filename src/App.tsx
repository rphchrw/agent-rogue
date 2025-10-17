import PhaseControls from './components/PhaseControls'
import StatusHUD from './components/StatusHUD'
import { usePhaseManager } from './hooks/usePhaseManager'

const App = () => {
  const { phase, day, week, started, startDay, endPhase, endDay } = usePhaseManager({
    onPhaseChange: (next) => console.debug('[PhaseManager] Phase changed:', next),
    onDayStart: (info) => console.debug('[PhaseManager] Day started:', info),
    onDayEnd: (summary) => console.debug('[PhaseManager] Day ended:', summary),
  })

  return (
    <main className="app">
      <h1>Agent Rogue</h1>
      <StatusHUD day={day} week={week} phase={phase} />
      {started ? (
        <PhaseControls onEndPhase={endPhase} onEndDay={endDay} />
      ) : (
        <button type="button" onClick={startDay}>
          Start Day
        </button>
      )}
    </main>
  )
}

export default App
