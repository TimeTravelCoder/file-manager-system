import { useState } from 'react'
import { CreateFileForm } from './components/CreateFileForm'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { Settings } from './components/Settings'

function App(): React.JSX.Element {
  const [view, setView] = useState<'dashboard' | 'create' | 'settings' | 'archive'>('dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && <Dashboard onCreateClick={() => setView('create')} />}
        {view === 'create' && <CreateFileForm />}
        {view === 'settings' && <Settings />}
        {view === 'archive' && <div className="p-8">Archive Browser (Coming Soon)</div>}
      </main>
    </div>
  )
}

export default App
