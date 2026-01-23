-- Add category_id to special_offers table
ALTER TABLE special_offers 
ADD COLUMN category_id UUID REFERENCES offer_categories(id);

-- Create policy to allow read access (if not already public)
-- (Assuming RLS is on, usually public read is allowed for offers)
-- If you need to enable RLS on the column specifically, it's usually covered by the table policy.

-- Optional: Add some index for performance
CREATE INDEX idx_special_offers_category_id ON special_offers(category_id);
