import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Upload from './pages/Upload'
import JobStatusPage from './pages/JobStatusPage'
import Results from './pages/Results'
import Providers from './pages/Providers'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Upload />} />
                <Route path="/job/:jobId" element={<JobStatusPage />} />
                <Route path="/job/:jobId/results" element={<Results />} />
                <Route path="/providers" element={<Providers />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
