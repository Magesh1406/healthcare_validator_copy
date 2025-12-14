import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CsvUploader({ onSuccess }) {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            return 'Please select a file'
        }

        const validExtensions = ['.csv']
        const validMimeTypes = ['text/csv', 'application/vnd.ms-excel']

        const fileName = selectedFile.name.toLowerCase()
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

        if (!hasValidExtension) {
            return 'Please select a CSV file'
        }

        if (!validMimeTypes.includes(selectedFile.type) && selectedFile.type !== '') {
            return 'Invalid file type. Please select a CSV file'
        }

        return null
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        setError('')

        if (selectedFile) {
            const validationError = validateFile(selectedFile)
            if (validationError) {
                setError(validationError)
                setFile(null)
                return
            }
            setFile(selectedFile)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!file) {
            setError('Please select a CSV file')
            return
        }

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        console.log("Starting upload for file:", file.name);
        setIsUploading(true);
        setUploadProgress(0); // Fetch doesn't support easy progress, so we'll simulate or just show loading
        setError('');

        const formData = new FormData();
        formData.append("file", file);

        try {
            console.log("Sending POST request to /providers/upload-csv via fetch...");

            // Artificial progress start
            setUploadProgress(10);

            const response = await fetch("/providers/upload-csv", {
                method: "POST",
                body: formData,
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Upload failed with content:", errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            setUploadProgress(100);
            const data = await response.json();
            console.log("Upload successful. Response data:", data);

            // Wait a bit to show 100%
            setTimeout(() => {
                if (data.job_id) {
                    console.log("Redirecting to job:", data.job_id);
                    navigate(`/job/${data.job_id}`);
                } else {
                    console.error("No job_id in response:", data);
                    setError("Server returned no Job ID");
                }
            }, 500);

        } catch (err) {
            console.error("Upload error caught:", err);
            setError(err.message || "Failed to upload CSV. See console for details.");
            setIsUploading(false);
        }
    }

    return (
        <div className="card">
            <form onSubmit={handleSubmit}>
                <div className="file-input-wrapper">
                    <input
                        type="file"
                        id="csv-file"
                        className="file-input"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="csv-file"
                        className={`file-input-label ${file ? 'has-file' : ''}`}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: file ? 'var(--success)' : 'var(--text-secondary)' }}
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <div>
                                {file ? (
                                    <>
                                        <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                                            {file.name}
                                        </p>
                                        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>
                                            Click to select CSV file
                                        </p>
                                        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                            or drag and drop
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </label>
                </div>

                {error && (
                    <div className="alert alert-error mt-3">
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
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary w-full mt-4"
                    disabled={isUploading || !file}
                >
                    {isUploading ? (
                        <>
                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                            Uploading...
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
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Upload and Start Validation
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}

export default CsvUploader
