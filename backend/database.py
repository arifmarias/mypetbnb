"""
Supabase PostgreSQL database client configuration and management
"""

import asyncio
import os
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
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
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

class DatabaseManager:
    def __init__(self):
        self._client: Optional[AsyncClient] = None
        self._lock = asyncio.Lock()
    
    async def get_client(self) -> AsyncClient:
        """Get or create async Supabase client with singleton pattern"""
        if self._client is not None:
            return self._client
        
        async with self._lock:
            if self._client is not None:
                return self._client
            
            try:
                options = ClientOptions(
                    postgrest_client_timeout=30,
                    storage_client_timeout=30,
                    schema="public",
                    headers={"User-Agent": "PetBnB-FastAPI-Client"},
                    auto_refresh_token=False,
                    persist_session=False
                )
                
                self._client = await create_async_client(
                    supabase_url=SUPABASE_URL,
                    supabase_key=SUPABASE_SERVICE_KEY,
                    options=options
                )
                
                logger.info("Supabase async client initialized successfully")
                return self._client
                
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise RuntimeError("Database connection failed") from e
    
    async def close_client(self):
        """Close the async client connection"""
        if self._client:
            # Don't call sign_out for service role key
            self._client = None
            logger.info("Supabase client connection closed")

# Global database manager instance
db_manager = DatabaseManager()

async def get_db_client() -> AsyncClient:
    """FastAPI dependency for database client injection"""
    return await db_manager.get_client()

@asynccontextmanager
async def get_db_session():
    """Context manager for database sessions with automatic cleanup"""
    client = await db_manager.get_client()
    try:
        yield client
    except Exception as e:
        logger.error(f"Database session error: {e}")
        raise
    finally:
        # Cleanup logic if needed
        pass

# Lifespan event handlers for FastAPI
async def startup_event():
    """Initialize database connection on application startup"""
    try:
        await db_manager.get_client()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to establish database connection: {e}")
        raise

async def shutdown_event():
    """Close database connection on application shutdown"""
    await db_manager.close_client()
    logger.info("Database connection closed")

# Database connection with retry logic
async def execute_with_retry(operation, max_retries: int = 3, delay: float = 1.0):
    """Execute database operation with retry logic"""
    for attempt in range(max_retries):
        try:
            return await operation()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            logger.warning(f"Database operation failed (attempt {attempt + 1}): {e}")
            await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff