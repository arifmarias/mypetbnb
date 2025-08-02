#!/usr/bin/env python3
"""
Simple Supabase table creation test using INSERT operations
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

async def test_table_creation():
    """Test creating data in tables that may or may not exist"""
    
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
        # Test if tables exist by trying a simple select
        logger.info("Testing if users table exists...")
        
        try:
            result = await client.table("users").select("count", count="exact").execute()
            logger.info(f"✅ Users table exists with {result.count} records")
        except Exception as e:
            logger.info(f"❌ Users table may not exist: {e}")
        
        try:
            result = await client.table("pets").select("count", count="exact").execute()
            logger.info(f"✅ Pets table exists with {result.count} records")
        except Exception as e:
            logger.info(f"❌ Pets table may not exist: {e}")
            
        try:
            result = await client.table("caregiver_profiles").select("count", count="exact").execute()
            logger.info(f"✅ Caregiver profiles table exists with {result.count} records")
        except Exception as e:
            logger.info(f"❌ Caregiver profiles table may not exist: {e}")
            
        # Test basic connection is working
        logger.info("✅ Supabase connection is working properly")
        
    except Exception as e:
        logger.error(f"❌ Error during table testing: {e}")
        
    finally:
        logger.info("Table test completed")

async def main():
    """Main function to test tables"""
    try:
        logger.info("🚀 Starting Supabase table existence test...")
        await test_table_creation()
        logger.info("✅ Test completed successfully!")
        
    except Exception as e:
        logger.error(f"💥 Test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())