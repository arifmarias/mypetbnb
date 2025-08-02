-- PetBnB Database Schema Creation Script for Supabase PostgreSQL
-- Run this script in the Supabase SQL Editor

-- Users table schema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image_url TEXT,
    user_type VARCHAR(20) CHECK (user_type IN ('pet_owner', 'caregiver', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    latitude FLOAT,
    longitude FLOAT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table schema
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    weight DECIMAL(5,2),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
    description TEXT,
    special_needs JSONB,
    vaccination_records JSONB,
    images JSONB,
    medical_info TEXT,
    behavioral_notes TEXT,
    emergency_contact VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caregiver profiles table
CREATE TABLE IF NOT EXISTS caregiver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INTEGER,
    hourly_rate DECIMAL(8,2),
    availability_schedule JSONB,
    service_area JSONB,
    certifications JSONB,
    portfolio_images JSONB,
    background_check_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    insurance_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caregiver services table
CREATE TABLE IF NOT EXISTS caregiver_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(8,2) NOT NULL,
    duration_minutes INTEGER,
    max_pets INTEGER DEFAULT 1,
    service_area_radius DECIMAL(5,2) DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table schema
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_owner_id UUID NOT NULL REFERENCES users(id),
    caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id),
    pet_id UUID NOT NULL REFERENCES pets(id),
    service_id UUID NOT NULL REFERENCES caregiver_services(id),
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    special_requirements TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table schema
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table schema
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table for Stripe integration
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) UNIQUE,
    payment_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'sgd',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'initiated', 'paid', 'failed', 'refunded', 'expired')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Primary indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user_id ON caregiver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pet_owner_id ON bookings(pet_owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_caregiver_id ON bookings(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(start_datetime, end_datetime);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_bookings_caregiver_status ON bookings(caregiver_id, booking_status);
CREATE INDEX IF NOT EXISTS idx_reviews_caregiver_visible ON reviews(caregiver_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

-- JSONB indexes for semi-structured data
CREATE INDEX IF NOT EXISTS idx_pets_special_needs ON pets USING GIN(special_needs);
CREATE INDEX IF NOT EXISTS idx_caregiver_availability ON caregiver_profiles USING GIN(availability_schedule);
CREATE INDEX IF NOT EXISTS idx_caregiver_service_area ON caregiver_profiles USING GIN(service_area);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_pets_description_fts ON pets USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_caregiver_bio_fts ON caregiver_profiles USING GIN(to_tsvector('english', bio));

-- Payment transaction indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Insert demo users
INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, is_active, email_verified, latitude, longitude) VALUES 
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'john.petowner@demo.com', '$2b$12$LQv3c1yqBwLFD5DAQr4P6exKj5D.M5V5v8E2KpO5X9J8yP7qJ8h3q', 'John', 'Smith', 'pet_owner', true, true, 1.3521, 103.8198),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'sarah.caregiver@demo.com', '$2b$12$LQv3c1yqBwLFD5DAQr4P6exKj5D.M5V5v8E2KpO5X9J8yP7qJ8h3q', 'Sarah', 'Johnson', 'caregiver', true, true, 1.3521, 103.8298)
ON CONFLICT (email) DO NOTHING;

-- Insert demo pet
INSERT INTO pets (id, owner_id, name, species, breed, age, weight, gender, description) VALUES 
('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Max', 'Dog', 'Golden Retriever', 6, 25.5, 'male', 'Friendly and energetic dog')
ON CONFLICT (id) DO NOTHING;

-- Insert caregiver profile
INSERT INTO caregiver_profiles (id, user_id, bio, experience_years, hourly_rate, rating, total_reviews, background_check_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Experienced pet caregiver with love for animals', 5, 25.00, 4.8, 45, true)
ON CONFLICT (id) DO NOTHING;

-- Insert caregiver service
INSERT INTO caregiver_services (caregiver_id, service_name, service_type, title, description, base_price, duration_minutes) VALUES 
('550e8400-e29b-41d4-a716-446655440020'::uuid, 'Dog Walking', 'dog_walking', 'Professional Dog Walking Service', 'Daily walks for your furry friends', 30.00, 60)
ON CONFLICT DO NOTHING;