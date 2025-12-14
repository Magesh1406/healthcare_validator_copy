import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ResultsTable from '../components/ResultsTable'

function Results() {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: results, isLoading, error } = useQuery({
        queryKey: ['job-results', jobId],
        queryFn: async () => {
            const response = await fetch(`/providers/results/${jobId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch results')
            }

            const data = await response.json()

            const enriched = await Promise.all(
                data.map(async (result) => {
                    if (result.provider_id) {
                        try {
                            const providerResp = await fetch(`/providers/${result.provider_id}`)
                            if (providerResp.ok) {
                                const providerData = await providerResp.json()
                                return {
                                    ...result,
                                    provider_name: providerData.provider?.name || 'Unknown',
                                    csv_npi: providerData.provider?.npi || 'N/A',
                                }
                            }
                        } catch (err) {
                            console.error('Failed to fetch provider:', err)
                        }
                    }
                    return {
                        ...result,
                        provider_name: 'Unknown',
                        csv_npi: 'N/A',
                    }
                })
            )

            return enriched
        },
    })

    const handleAutoCorrect = async () => {
        await fetch(`/providers/correct/${jobId}`, {
            method: 'POST',
        })

        // Refresh results after correction
        queryClient.invalidateQueries(['job-results', jobId])
    }

    if (isLoading) {
        return (
            <div className="container container-narrow" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card flex flex-col items-center gap-4">
                    <div className="spinner"></div>
                    <p>Loading results...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container container-narrow" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card">
                    <div className="alert alert-error">{error.message}</div>
                    <button
                        className="btn btn-secondary mt-4"
                        onClick={() => navigate(`/job/${jobId}`)}
                    >
                        Back to Job Status
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h1>Validation Results</h1>
                    <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Review and analyze provider validation results
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        className="btn btn-primary"
                        onClick={handleAutoCorrect}
                    >
                        Auto-Correct Mismatches
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/job/${jobId}`)}
                    >
                        Back to Job
                    </button>
                </div>
            </div>

            <ResultsTable results={results} />
        </div>
    )
}

export default Results
