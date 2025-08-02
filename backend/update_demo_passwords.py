#!/usr/bin/env python3
"""
Update demo user passwords in Supabase with correct bcrypt hashing
"""

import asyncio
import os
import logging
from supabase import create_async_client, AsyncClient
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv
from auth import AuthService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

async def update_demo_passwords():
    """Update demo user passwords with correct bcrypt hashing"""
    
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
        # Generate correct password hash
        password = "TestPassword123!"
        hashed_password = AuthService.get_password_hash(password)
        logger.info(f"Generated password hash: {hashed_password}")
        
        # Update demo users
        demo_users = [
            {
                "email": "john.petowner@demo.com",
                "user_type": "pet_owner"
            },
            {
                "email": "sarah.caregiver@demo.com", 
                "user_type": "caregiver"
            }
        ]
        
        for user in demo_users:
            # Check if user exists
            result = await client.table("users").select("*").eq("email", user["email"]).execute()
            
            if result.data:
                # Update password
                update_result = await client.table("users").update({
                    "password_hash": hashed_password
                }).eq("email", user["email"]).execute()
                
                if update_result.data:
                    logger.info(f"✅ Updated password for {user['email']}")
                else:
                    logger.error(f"❌ Failed to update password for {user['email']}")
            else:
                # Create user if doesn't exist
                user_data = {
                    "id": "550e8400-e29b-41d4-a716-446655440001" if user["user_type"] == "pet_owner" else "550e8400-e29b-41d4-a716-446655440002",
                    "email": user["email"],
                    "password_hash": hashed_password,
                    "first_name": "John" if user["user_type"] == "pet_owner" else "Sarah",
                    "last_name": "Smith" if user["user_type"] == "pet_owner" else "Johnson",
                    "user_type": user["user_type"],
                    "is_active": True,
                    "email_verified": True,
                    "latitude": 1.3521,
                    "longitude": 103.8198 if user["user_type"] == "pet_owner" else 103.8298
                }
                
                create_result = await client.table("users").upsert(user_data).execute()
                
                if create_result.data:
                    logger.info(f"✅ Created/updated user {user['email']}")
                    
                    # Create caregiver profile if needed
                    if user["user_type"] == "caregiver":
                        profile_data = {
                            "id": "550e8400-e29b-41d4-a716-446655440020",
                            "user_id": "550e8400-e29b-41d4-a716-446655440002",
                            "bio": "Experienced pet caregiver with love for animals",
                            "experience_years": 5,
                            "hourly_rate": 25.00,
                            "rating": 4.8,
                            "total_reviews": 45,
                            "background_check_verified": True
                        }
                        
                        await client.table("caregiver_profiles").upsert(profile_data).execute()
                        logger.info(f"✅ Created caregiver profile for {user['email']}")
                else:
                    logger.error(f"❌ Failed to create user {user['email']}")
        
        logger.info("🎉 Demo user password update completed!")
        
    except Exception as e:
        logger.error(f"❌ Error during password update: {e}")
        
    finally:
        logger.info("Password update process finished")

async def main():
    """Main function"""
    try:
        logger.info("🚀 Starting demo user password update...")
        await update_demo_passwords()
        logger.info("✅ Update completed successfully!")
        
    except Exception as e:
        logger.error(f"💥 Update failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())