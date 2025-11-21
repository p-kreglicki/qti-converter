-- Add title and file_type to conversions table
ALTER TABLE conversions ADD COLUMN title TEXT;
ALTER TABLE conversions ADD COLUMN file_type TEXT CHECK (file_type IN ('csv', 'excel'));

-- Update existing records (if any) to have a default title from filename
UPDATE conversions SET title = original_filename WHERE title IS NULL;
UPDATE conversions SET file_type = 'csv' WHERE file_type IS NULL; -- Default to csv for now
