-- Products table for business products (separate from services)
-- Products are items that can be sold but don't require duration/appointments
-- Examples: dental care products, car parts, retail items, etc.

CREATE TABLE IF NOT EXISTS business_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL, -- References the business type from clients table
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    
    -- Basic product information
    product_name TEXT NOT NULL,
    product_description TEXT,
    product_code TEXT, -- SKU or product code
    brand TEXT,
    
    -- Pricing information
    price DECIMAL(10, 2),
    price_currency TEXT DEFAULT 'USD',
    cost DECIMAL(10, 2), -- Cost to business (for margin calculation)
    
    -- Inventory tracking
    track_inventory BOOLEAN DEFAULT false,
    current_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 0,
    
    -- Product details
    weight DECIMAL(8, 2), -- Weight in kg
    dimensions_length DECIMAL(8, 2), -- Length in cm
    dimensions_width DECIMAL(8, 2), -- Width in cm
    dimensions_height DECIMAL(8, 2), -- Height in cm
    
    -- Product images and documents
    image_urls TEXT[], -- Array of image URLs
    product_documents TEXT[], -- Array of document URLs
    
    -- Business logic
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product categories table (separate from service categories)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type TEXT NOT NULL, -- References the business type from clients table
    category_name TEXT NOT NULL,
    category_description TEXT,
    parent_category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE, -- For nested categories
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_type, category_name)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_products_user_id ON business_products(user_id);
CREATE INDEX IF NOT EXISTS idx_business_products_business_type ON business_products(business_type);
CREATE INDEX IF NOT EXISTS idx_business_products_category_id ON business_products(category_id);
CREATE INDEX IF NOT EXISTS idx_business_products_active ON business_products(is_active);
CREATE INDEX IF NOT EXISTS idx_business_products_display_order ON business_products(display_order);

CREATE INDEX IF NOT EXISTS idx_product_categories_business_type ON product_categories(business_type);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- Row Level Security (RLS) policies
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Users can only access their own products
CREATE POLICY "Users can view their own products" ON business_products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON business_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON business_products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON business_products
    FOR DELETE USING (auth.uid() = user_id);

-- Product categories can be viewed by anyone with the same business type
-- but only created/modified by users (for now, we'll use user-specific categories)
CREATE POLICY "Users can view product categories for their business type" ON product_categories
    FOR SELECT USING (true); -- Allow reading for business type matching

CREATE POLICY "Users can insert product categories" ON product_categories
    FOR INSERT WITH CHECK (true); -- Allow creation for any business type

CREATE POLICY "Users can update product categories" ON product_categories
    FOR UPDATE USING (true); -- Allow updates (can be restricted later)

CREATE POLICY "Users can delete product categories" ON product_categories
    FOR DELETE USING (true); -- Allow deletion (can be restricted later)

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_products_updated_at 
    BEFORE UPDATE ON business_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample product categories for different business types
INSERT INTO product_categories (business_type, category_name, category_description, display_order) VALUES
-- Dental business product categories
('dental', 'Oral Care Products', 'Toothpastes, mouthwashes, and daily oral care items', 1),
('dental', 'Dental Tools', 'Professional and home dental care tools', 2),
('dental', 'Orthodontic Supplies', 'Braces, retainers, and orthodontic accessories', 3),
('dental', 'Whitening Products', 'Teeth whitening kits and products', 4),

-- Automotive business product categories
('automotive', 'Engine Parts', 'Engine components and replacement parts', 1),
('automotive', 'Body Parts', 'Exterior and interior body components', 2),
('automotive', 'Fluids & Lubricants', 'Motor oils, brake fluids, and automotive chemicals', 3),
('automotive', 'Accessories', 'Car accessories and enhancement products', 4),
('automotive', 'Tires & Wheels', 'Tires, rims, and wheel-related products', 5),

-- General retail categories
('retail', 'Electronics', 'Consumer electronics and gadgets', 1),
('retail', 'Clothing', 'Apparel and fashion items', 2),
('retail', 'Home & Garden', 'Home improvement and gardening products', 3),
('retail', 'Sports & Outdoors', 'Sports equipment and outdoor gear', 4),

-- Healthcare/Medical product categories
('healthcare', 'Medical Supplies', 'Basic medical supplies and equipment', 1),
('healthcare', 'Wellness Products', 'Health and wellness supplements and products', 2),
('healthcare', 'Personal Care', 'Personal hygiene and care products', 3),

-- Beauty/Salon product categories
('beauty', 'Hair Care Products', 'Shampoos, conditioners, and hair treatments', 1),
('beauty', 'Skincare Products', 'Cleansers, moisturizers, and skincare treatments', 2),
('beauty', 'Makeup Products', 'Cosmetics and beauty enhancement products', 3),
('beauty', 'Nail Care Products', 'Nail polishes, treatments, and nail care items', 4),
('beauty', 'Professional Tools', 'Professional beauty and styling tools', 5)

ON CONFLICT (business_type, category_name) DO NOTHING;