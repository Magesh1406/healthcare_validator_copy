-- Add job_id column to providers table if it doesn't exist
-- This allows tracking which job each provider belongs to
ALTER TABLE IF EXISTS public.providers
ADD COLUMN IF NOT EXISTS job_id TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_providers_job_id ON public.providers(job_id);

-- Add job_id column to validation_results for easier querying
ALTER TABLE IF EXISTS public.validation_results
ADD COLUMN IF NOT EXISTS job_id TEXT;

-- Add wide columns for validation match statuses if they don't exist
-- This aligns with the backend 'row-per-provider' validation logic
ALTER TABLE IF EXISTS public.validation_results
ADD COLUMN IF NOT EXISTS name_match BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_match BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS address_match BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS raw_api_data JSONB DEFAULT '{}'::jsonb;

-- Add index for validation_results job_id
CREATE INDEX IF NOT EXISTS idx_validation_results_job_id ON public.validation_results(job_id);

-- Note: The validation_jobs table uses 'id' as the primary key UUID
-- The backend code references this as 'job_id' in queries
-- No schema changes needed for validation_jobs
