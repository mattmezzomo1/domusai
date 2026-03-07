-- Add tracking configuration columns to restaurants table

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(255) DEFAULT NULL AFTER enable_modifications,
ADD COLUMN IF NOT EXISTS meta_conversion_api_token VARCHAR(500) DEFAULT NULL AFTER facebook_pixel_id,
ADD COLUMN IF NOT EXISTS gtm_container_id VARCHAR(255) DEFAULT NULL AFTER meta_conversion_api_token;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurants_facebook_pixel ON restaurants(facebook_pixel_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_gtm_container ON restaurants(gtm_container_id);

