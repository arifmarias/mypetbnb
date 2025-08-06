-- Create pets table in Supabase
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL DEFAULT 'dog',
    breed VARCHAR(100),
    age INTEGER,
    weight DECIMAL(5,2),
    gender VARCHAR(20) DEFAULT 'unknown',
    description TEXT,
    images TEXT[] DEFAULT '{}',
    medical_info JSONB DEFAULT '{}',
    behavioral_notes JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    vaccination_records JSONB DEFAULT '{}',
    special_needs JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (assumes you have a users table)
    CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_is_active ON pets(is_active);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_pets_updated_at_trigger ON pets;
CREATE TRIGGER update_pets_updated_at_trigger
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_pets_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Pet owners can view their own pets
CREATE POLICY "Pet owners can view own pets" ON pets
    FOR SELECT USING (owner_id = auth.uid());

-- Pet owners can insert their own pets
CREATE POLICY "Pet owners can insert own pets" ON pets
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Pet owners can update their own pets
CREATE POLICY "Pet owners can update own pets" ON pets
    FOR UPDATE USING (owner_id = auth.uid());

-- Pet owners can delete their own pets
CREATE POLICY "Pet owners can delete own pets" ON pets
    FOR DELETE USING (owner_id = auth.uid());

-- Caregivers can view pets for approved bookings
CREATE POLICY "Caregivers can view pets for bookings" ON pets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.pet_ids @> ARRAY[pets.id::text]
            AND bookings.caregiver_service_id IN (
                SELECT cs.id FROM caregiver_services cs
                INNER JOIN caregiver_profiles cp ON cs.caregiver_id = cp.id
                WHERE cp.user_id = auth.uid()
            )
            AND bookings.booking_status IN ('confirmed', 'in_progress', 'completed')
        )
    );

-- Add helpful comments
COMMENT ON TABLE pets IS 'Pet profiles belonging to pet owners';
COMMENT ON COLUMN pets.medical_info IS 'JSON object containing vaccination, medication, allergy, and vet information';
COMMENT ON COLUMN pets.behavioral_notes IS 'JSON object containing personality, training, and behavioral information';
COMMENT ON COLUMN pets.emergency_contact IS 'JSON object containing emergency contact and care instructions';
COMMENT ON COLUMN pets.images IS 'Array of image URLs for the pet';
COMMENT ON COLUMN pets.is_active IS 'Soft delete flag - false means pet is deleted';