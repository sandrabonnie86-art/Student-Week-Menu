-- Add admin_pin and usher_pin to app_config table
ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS admin_pin TEXT,
ADD COLUMN IF NOT EXISTS usher_pin TEXT;

-- Add vendor_pin to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS vendor_pin TEXT;
