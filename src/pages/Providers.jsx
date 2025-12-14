import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

function Providers() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')

    const { data: providers, isLoading, error } = useQuery({
        queryKey: ['providers'],
        queryFn: async () => {
            const response = await fetch('/providers')
            if (!response.ok) {
                throw new Error('Failed to fetch providers')
            }
            return response.json()
        },
    })

    const filteredProviders = (providers || []).filter(provider => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            provider.name?.toLowerCase().includes(query) ||
            provider.npi?.toLowerCase().includes(query)
        )
    })

    if (isLoading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card flex flex-col items-center gap-4">
                    <div className="spinner"></div>
                    <p>Loading providers...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
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
            </div>
        )
    }

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h1>Providers</h1>
                    <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Browse all uploaded providers
                    </p>
                </div>
                <button
                    className="btn btn-primary"
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload New CSV
                </button>
            </div>

            <div className="card">
                <div className="mb-4">
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by provider name or NPI..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                    Showing {filteredProviders.length} of {providers?.length || 0} providers
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>NPI</th>
                                <th>Type</th>
                                <th>Phone</th>
                                <th>City, State</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProviders.map((provider) => (
                                <tr key={provider.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>
                                        {provider.name}
                                    </td>
                                    <td>
                                        <code style={{ background: 'var(--surface-light)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                            {provider.npi}
                                        </code>
                                    </td>
                                    <td>{provider.enumeration_type || 'N/A'}</td>
                                    <td>{provider.phone || 'N/A'}</td>
                                    <td>
                                        {provider.city}, {provider.state}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                                            onClick={() => navigate(`/providers/${provider.id}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProviders.length === 0 && (
                    <div className="text-center mt-4">
                        <p style={{ color: 'var(--text-secondary)' }}>
                            No providers found matching your search
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Providers
