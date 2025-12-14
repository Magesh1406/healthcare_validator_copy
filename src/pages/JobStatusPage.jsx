import { useParams } from 'react-router-dom'
import JobStatus from '../components/JobStatus'

function JobStatusPage() {
    const { jobId } = useParams()

    return (
        <div className="container container-narrow" style={{ paddingTop: 'var(--spacing-2xl)' }}>
            <div className="text-center mb-5">
                <h1>Validation Progress</h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
                    Monitor your provider validation job in real-time
                </p>
            </div>

            <JobStatus jobId={jobId} />
        </div>
    )
}

export default JobStatusPage
