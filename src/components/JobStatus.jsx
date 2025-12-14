import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

function JobStatus({ jobId }) {
    const navigate = useNavigate()
    const [isTriggering, setIsTriggering] = useState(false)

    const { data: jobData, isLoading, error } = useQuery({
        queryKey: ['job-status', jobId],
        queryFn: async () => {
            const response = await fetch(`/jobs/${jobId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch job status')
            }
            const data = await response.json()
            // Backend returns array, we need first element
            return Array.isArray(data) ? data[0] : data
        },
        refetchInterval: (data) => {
            // Stop polling if job is completed or failed
            if (!data) return 2000
            const status = data.status || data.data?.status
            return (status === 'completed' || status === 'failed') ? false : 2000
        },
    })

    const handleTriggerValidation = async () => {
        setIsTriggering(true)
        try {
            const response = await fetch(`/providers/validate/${jobId}`, {
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error('Failed to trigger validation')
            }
            // The polling will automatically pick up the status change
        } catch (err) {
            console.error('Validation trigger error:', err)
            alert('Failed to trigger validation. Please try again.')
        } finally {
            setIsTriggering(false)
        }
    }

    const handleViewResults = () => {
        navigate(`/job/${jobId}/results`)
    }

    if (isLoading) {
        return (
            <div className="card flex flex-col items-center gap-4">
                <div className="spinner"></div>
                <p>Loading job status...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="card">
                <div className="alert alert-error">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error.message}
                </div>
            </div>
        )
    }

    if (!jobData) {
        return (
            <div className="card">
                <div className="alert alert-error">
                    Job not found
                </div>
            </div>
        )
    }

    const status = jobData.status
    const completedCount = jobData.completed_count || 0
    const totalCount = jobData.total_count || 0
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="badge badge-success">Completed</span>
            case 'failed':
                return <span className="badge badge-error">Failed</span>
            case 'running':
            case 'processing':
                return <span className="badge badge-info">Processing</span>
            case 'pending':
            default:
                return <span className="badge badge-warning">Pending</span>
        }
    }

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2>Validation Job</h2>
                {getStatusBadge(status)}
            </div>

            <div className="mb-4">
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Job ID: <code style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>{jobId}</code>
                </p>
            </div>

            <div className="mb-4">
                <div className="flex justify-between mb-2">
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Progress
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {completedCount} of {totalCount} validated
                    </span>
                </div>
                <div className="progress-container">
                    <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-center mt-2" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                    {progress.toFixed(0)}%
                </div>
            </div>

            <div className="flex gap-3 mt-5">
                {status === 'pending' && (
                    <button
                        className="btn btn-primary flex-1"
                        onClick={handleTriggerValidation}
                        disabled={isTriggering}
                    >
                        {isTriggering ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                Triggering...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Trigger Validation
                            </>
                        )}
                    </button>
                )}

                {status === 'completed' && (
                    <button
                        className="btn btn-success flex-1"
                        onClick={handleViewResults}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Results
                    </button>
                )}

                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/')}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Back to Upload
                </button>
            </div>
        </div>
    )
}

export default JobStatus
