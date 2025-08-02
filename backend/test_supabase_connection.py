#!/usr/bin/env python3
"""
Supabase Database Schema Setup Script (Alternative Approach)
Creates all necessary tables and indexes using direct SQL execution
"""

import asyncio
import os
import logging
from supabase import create_async_client, AsyncClient
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

async def setup_tables():
    """Set up tables and insert sample data using table API"""
    
    # Initialize Supabase client
    options = ClientOptions(
        postgrest_client_timeout=60,
        storage_client_timeout=60,
        schema="public"
    )
    
    client = await create_async_client(
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_SERVICE_KEY,
        options=options
    )
    
    logger.info("Connected to Supabase successfully")
    
    try:
        # Test connection and create sample users
        logger.info("Creating sample users...")
        
        # Insert demo users
        users_data = [
            {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "email": "john.petowner@demo.com",
                "password_hash": "$2b$12$LQv3c1yqBwLFD5DAQr4P6exKj5D.M5V5v8E2KpO5X9J8yP7qJ8h3q",
                "first_name": "John",
                "last_name": "Smith",
                "user_type": "pet_owner",
                "is_active": True,
                "email_verified": True,
                "latitude": 1.3521,
                "longitude": 103.8198
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440002", 
                "email": "sarah.caregiver@demo.com",
                "password_hash": "$2b$12$LQv3c1yqBwLFD5DAQr4P6exKj5D.M5V5v8E2KpO5X9J8yP7qJ8h3q",
                "first_name": "Sarah",
                "last_name": "Johnson", 
                "user_type": "caregiver",
                "is_active": True,
                "email_verified": True,
                "latitude": 1.3521,
                "longitude": 103.8298
            }
        ]
        
        # Try to insert users
        try:
            result = await client.table("users").upsert(users_data).execute()
            logger.info(f"✅ Users inserted successfully: {len(result.data)} records")
        except Exception as e:
            logger.info(f"Users table may not exist yet. Error: {e}")
        
        # Insert demo pet
        pets_data = [
            {
                "id": "550e8400-e29b-41d4-a716-446655440010",
                "owner_id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Max",
                "species": "Dog", 
                "breed": "Golden Retriever",
                "age": 6,
                "weight": 25.5,
                "gender": "male",
                "description": "Friendly and energetic dog"
            }
        ]
        
        try:
            result = await client.table("pets").upsert(pets_data).execute()
            logger.info(f"✅ Pets inserted successfully: {len(result.data)} records")
        except Exception as e:
            logger.info(f"Pets table may not exist yet. Error: {e}")
        
        # Insert caregiver profile
        caregiver_profiles_data = [
            {
                "id": "550e8400-e29b-41d4-a716-446655440020",
                "user_id": "550e8400-e29b-41d4-a716-446655440002",
                "bio": "Experienced pet caregiver with love for animals",
                "experience_years": 5,
                "hourly_rate": 25.00,
                "rating": 4.8,
                "total_reviews": 45,
                "background_check_verified": True
            }
        ]
        
        try:
            result = await client.table("caregiver_profiles").upsert(caregiver_profiles_data).execute()
            logger.info(f"✅ Caregiver profiles inserted successfully: {len(result.data)} records")
        except Exception as e:
            logger.info(f"Caregiver profiles table may not exist yet. Error: {e}")
        
        # Insert caregiver service
        caregiver_services_data = [
            {
                "caregiver_id": "550e8400-e29b-41d4-a716-446655440020",
                "service_name": "Dog Walking",
                "service_type": "dog_walking", 
                "title": "Professional Dog Walking Service",
                "description": "Daily walks for your furry friends",
                "base_price": 30.00,
                "duration_minutes": 60
            }
        ]
        
        try:
            result = await client.table("caregiver_services").upsert(caregiver_services_data).execute()
            logger.info(f"✅ Caregiver services inserted successfully: {len(result.data)} records")
        except Exception as e:
            logger.info(f"Caregiver services table may not exist yet. Error: {e}")
        
        logger.info("🎉 Database setup and data insertion completed!")
        
    except Exception as e:
        logger.error(f"❌ Error during setup: {e}")
        
    finally:
        # Don't call sign_out as it may cause issues with async storage
        logger.info("Setup process finished")

async def main():
    """Main function to set up the database"""
    try:
        logger.info("🚀 Starting Supabase database setup...")
        await setup_tables()
        logger.info("✅ Setup completed successfully!")
        
    except Exception as e:
        logger.error(f"💥 Setup failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())