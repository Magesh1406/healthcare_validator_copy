import { useNavigate } from 'react-router-dom'
import CsvUploader from '../components/CsvUploader'

function Upload() {
    const navigate = useNavigate()

    const handleUploadSuccess = (jobId) => {
        navigate(`/job/${jobId}`)
    }

    return (
        <div className="container container-narrow" style={{ paddingTop: 'var(--spacing-2xl)' }}>
            <div className="text-center mb-5">
                <h1>Healthcare Provider Validation</h1>
                <p style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                    Upload a CSV file containing provider data to validate against the NPI Registry
                </p>
            </div>

            <CsvUploader onSuccess={handleUploadSuccess} />

            <div className="mt-4 text-center">
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Expected CSV columns: name, enumeration_type, npi, taxonomy, phone, address_1, city, state, postal_code
                </p>
            </div>
        </div>
    )
}

export default Upload
