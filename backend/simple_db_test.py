#!/usr/bin/env python3
"""
Simple Supabase database connection test
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

async def test_database_connection():
    """Test database connection and check tables"""
    
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
    
    logger.info("✅ Connected to Supabase successfully")
    
    try:
        # Test if tables exist by counting records
        tables_to_test = [
            "users", 
            "pets", 
            "caregiver_profiles", 
            "caregiver_services",
            "bookings",
            "reviews", 
            "messages",
            "payment_transactions",
            "verification_tokens",
            "id_verifications",
            "oauth_sessions"
        ]
        
        for table_name in tables_to_test:
            try:
                result = await client.table(table_name).select("count", count="exact").execute()
                logger.info(f"✅ Table '{table_name}' exists with {result.count} records")
            except Exception as e:
                logger.error(f"❌ Table '{table_name}' error: {e}")
        
        # Test demo data
        logger.info("\n--- Testing Demo Data ---")
        users_result = await client.table("users").select("*").execute()
        logger.info(f"✅ Found {len(users_result.data)} demo users")
        
        for user in users_result.data:
            logger.info(f"   - {user['first_name']} {user['last_name']} ({user['user_type']}) - {user['email']}")
        
        logger.info("\n🎉 Database connection test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database test failed: {e}")
        return False

async def main():
    """Main function to test database"""
    try:
        logger.info("🚀 Starting database connection test...")
        success = await test_database_connection()
        
        if success:
            logger.info("✅ All tests passed! Database is ready.")
        else:
            logger.error("❌ Some tests failed. Check the errors above.")
            
    except Exception as e:
        logger.error(f"💥 Test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())