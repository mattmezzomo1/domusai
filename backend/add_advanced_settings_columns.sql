-- Add advanced settings columns to restaurants table

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS max_party_size INT DEFAULT 12 AFTER whatsapp_message_template,
ADD COLUMN IF NOT EXISTS max_online_party_size INT DEFAULT 8 AFTER max_party_size,
ADD COLUMN IF NOT EXISTS booking_cutoff_hours DOUBLE DEFAULT 2 AFTER max_online_party_size,
ADD COLUMN IF NOT EXISTS cancellation_cutoff_hours DOUBLE DEFAULT 2 AFTER booking_cutoff_hours,
ADD COLUMN IF NOT EXISTS modification_cutoff_hours DOUBLE DEFAULT 2 AFTER cancellation_cutoff_hours,
ADD COLUMN IF NOT EXISTS late_tolerance_minutes INT DEFAULT 15 AFTER modification_cutoff_hours,
ADD COLUMN IF NOT EXISTS enable_waitlist TINYINT(1) DEFAULT 1 AFTER late_tolerance_minutes,
ADD COLUMN IF NOT EXISTS enable_table_joining TINYINT(1) DEFAULT 1 AFTER enable_waitlist,
ADD COLUMN IF NOT EXISTS enable_modifications TINYINT(1) DEFAULT 1 AFTER enable_table_joining;

