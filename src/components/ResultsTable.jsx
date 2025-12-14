import { useState, useMemo } from 'react'

function ResultsTable({ results = [], pageSize = 25 }) {
    const [onlyMismatches, setOnlyMismatches] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const filteredResults = useMemo(() => {
        let data = results

        if (onlyMismatches) {
            data = data.filter(
                r =>
                    r.name_match === false ||
                    r.phone_match === false ||
                    r.address_match === false
            )
        }

        return data
    }, [results, onlyMismatches])

    const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize))

    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredResults.slice(start, start + pageSize)
    }, [filteredResults, currentPage, pageSize])

    const getMatchBadge = (value) => {
        if (value === true) return <span className="badge badge-success">Match</span>
        if (value === false) return <span className="badge badge-error">Mismatch</span>
        return <span className="badge badge-warning">Unknown</span>
    }

    const getStatusBadge = (row) => {
        if (
            row.name_match === false ||
            row.phone_match === false ||
            row.address_match === false
        ) {
            return <span className="badge badge-error">Needs Review</span>
        }
        return <span className="badge badge-success">Validated</span>
    }

    const getConfidence = (scores) => {
        if (!scores || Object.keys(scores).length === 0) return '—'
        let max = 0
        Object.values(scores).forEach(v => {
            if (typeof v === 'number' && v > max) max = v
        })
        return `${Math.round(max * 100)}%`
    }

    if (!results.length) {
        return (
            <div className="card text-center">
                <p>No results available</p>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="mb-3">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={onlyMismatches}
                        onChange={(e) => {
                            setOnlyMismatches(e.target.checked)
                            setCurrentPage(1)
                        }}
                    />
                    Only mismatches
                </label>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th>CSV NPI</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedResults.map((row, idx) => (
                            <tr key={row.id || idx}>
                                <td>{row.provider_name || '—'}</td>
                                <td>{row.csv_npi || '—'}</td>
                                <td>{getMatchBadge(row.name_match)}</td>
                                <td>{getMatchBadge(row.phone_match)}</td>
                                <td>{getMatchBadge(row.address_match)}</td>
                                <td>{getStatusBadge(row)}</td>
                                <td>{getConfidence(row.confidence_scores)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between mt-4">
                    <button
                        className="btn btn-secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="btn btn-secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}

export default ResultsTable
