# backend/stats_endpoints.py
"""
Statistics API endpoints for dashboard data
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
from database import get_db_client
from auth import get_current_user

logger = logging.getLogger(__name__)

stats_router = APIRouter(prefix="/api/stats", tags=["statistics"])

@stats_router.get("/user")
async def get_user_stats(current_user: dict = Depends(get_current_user), db = Depends(get_db_client)):
    """Get statistics for pet owner users"""
    try:
        if current_user.get("user_type") != "pet_owner":
            raise HTTPException(status_code=403, detail="Only pet owners can access user stats")
        
        user_id = current_user["user_id"]
        
        # Get basic stats
        stats = {}
        
        # Total bookings
        bookings_result = await db.table("bookings").select("id, booking_status, total_amount").eq("pet_owner_id", user_id).execute()
        bookings = bookings_result.data or []
        
        stats["total_bookings"] = len(bookings)
        stats["completed_bookings"] = len([b for b in bookings if b.get("booking_status") == "completed"])
        stats["total_spent"] = sum(float(b.get("total_amount", 0)) for b in bookings if b.get("booking_status") == "completed")
        
        # Upcoming services
        current_time = datetime.utcnow().isoformat()
        upcoming_result = await db.table("bookings").select("id").eq("pet_owner_id", user_id).gte("start_datetime", current_time).in_("booking_status", ["pending", "confirmed"]).execute()
        stats["upcoming_services"] = len(upcoming_result.data or [])
        
        # Active pets
        pets_result = await db.table("pets").select("id").eq("owner_id", user_id).eq("is_active", True).execute()
        stats["active_pets"] = len(pets_result.data or [])
        
        # Average rating (from reviews given by this pet owner)
        reviews_result = await db.table("reviews").select("rating").eq("pet_owner_id", user_id).execute()
        reviews = reviews_result.data or []
        if reviews:
            stats["average_rating"] = round(sum(r.get("rating", 0) for r in reviews) / len(reviews), 1)
        else:
            stats["average_rating"] = 0
        
        # Favorite caregivers count
        favorites_result = await db.table("user_favorites").select("id").eq("user_id", user_id).execute()
        stats["favorite_caregivers"] = len(favorites_result.data or [])
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user statistics")

@stats_router.get("/caregiver")
async def get_caregiver_stats(current_user: dict = Depends(get_current_user), db = Depends(get_db_client)):
    """Get statistics for caregiver users"""
    try:
        if current_user.get("user_type") != "caregiver":
            raise HTTPException(status_code=403, detail="Only caregivers can access caregiver stats")
        
        user_id = current_user["user_id"]
        
        # Get caregiver profile
        profile_result = await db.table("caregiver_profiles").select("*").eq("user_id", user_id).execute()
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="Caregiver profile not found")
        
        profile = profile_result.data[0]
        caregiver_id = profile["id"]
        
        stats = {}
        
        # Basic profile stats
        stats["average_rating"] = float(profile.get("rating", 0))
        stats["total_reviews"] = int(profile.get("total_reviews", 0))
        
        # Booking stats
        bookings_result = await db.table("bookings").select("id, booking_status, total_amount, created_at").eq("caregiver_id", caregiver_id).execute()
        bookings = bookings_result.data or []
        
        stats["total_bookings"] = len(bookings)
        stats["completed_bookings"] = len([b for b in bookings if b.get("booking_status") == "completed"])
        
        # Calculate response rate and acceptance rate
        pending_bookings = [b for b in bookings if b.get("booking_status") == "pending"]
        responded_bookings = [b for b in bookings if b.get("booking_status") in ["confirmed", "rejected"]]
        accepted_bookings = [b for b in bookings if b.get("booking_status") == "confirmed"]
        
        total_requests = len(bookings)
        if total_requests > 0:
            stats["response_rate"] = round((len(responded_bookings) / total_requests) * 100, 1)
            stats["acceptance_rate"] = round((len(accepted_bookings) / total_requests) * 100, 1)
        else:
            stats["response_rate"] = 0
            stats["acceptance_rate"] = 0
        
        # Active services
        services_result = await db.table("caregiver_services").select("id").eq("caregiver_id", caregiver_id).eq("is_active", True).execute()
        stats["active_services"] = len(services_result.data or [])
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get caregiver stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get caregiver statistics")

@stats_router.get("/caregiver/earnings")
async def get_caregiver_earnings(current_user: dict = Depends(get_current_user), db = Depends(get_db_client)):
    """Get earnings statistics for caregiver"""
    try:
        if current_user.get("user_type") != "caregiver":
            raise HTTPException(status_code=403, detail="Only caregivers can access earnings stats")
        
        user_id = current_user["user_id"]
        
        # Get caregiver profile
        profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", user_id).execute()
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="Caregiver profile not found")
        
        caregiver_id = profile_result.data[0]["id"]
        
        # Get completed bookings with amounts
        bookings_result = await db.table("bookings").select("total_amount, created_at, start_datetime").eq("caregiver_id", caregiver_id).eq("booking_status", "completed").execute()
        bookings = bookings_result.data or []
        
        earnings = {}
        
        # Calculate total earnings (subtract 10% commission)
        total_gross = sum(float(b.get("total_amount", 0)) for b in bookings)
        commission_rate = 0.10  # 10% commission
        earnings["total_earnings"] = round(total_gross * (1 - commission_rate), 2)
        
        # Current month earnings
        now = datetime.utcnow()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        current_month_bookings = [
            b for b in bookings 
            if datetime.fromisoformat(b.get("start_datetime", "").replace('Z', '+00:00')) >= current_month_start
        ]
        current_month_gross = sum(float(b.get("total_amount", 0)) for b in current_month_bookings)
        earnings["current_month_earnings"] = round(current_month_gross * (1 - commission_rate), 2)
        
        # Last month earnings
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        
        last_month_bookings = [
            b for b in bookings 
            if last_month_start <= datetime.fromisoformat(b.get("start_datetime", "").replace('Z', '+00:00')) <= last_month_end
        ]
        last_month_gross = sum(float(b.get("total_amount", 0)) for b in last_month_bookings)
        earnings["last_month_earnings"] = round(last_month_gross * (1 - commission_rate), 2)
        
        # Current week earnings
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        current_week_bookings = [
            b for b in bookings 
            if datetime.fromisoformat(b.get("start_datetime", "").replace('Z', '+00:00')) >= week_start
        ]
        current_week_gross = sum(float(b.get("total_amount", 0)) for b in current_week_bookings)
        earnings["current_week_earnings"] = round(current_week_gross * (1 - commission_rate), 2)
        
        # Pending payouts (for completed but unpaid bookings)
        # This would typically involve checking payment_transactions table
        earnings["pending_payouts"] = 0  # Placeholder - implement based on payment system
        earnings["completed_payouts"] = earnings["total_earnings"]  # Placeholder
        
        return earnings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get caregiver earnings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get caregiver earnings")

@stats_router.get("/bookings")
async def get_booking_stats(current_user: dict = Depends(get_current_user), db = Depends(get_db_client)):
    """Get booking statistics for current user"""
    try:
        user_id = current_user["user_id"]
        user_type = current_user.get("user_type")
        
        stats = {}
        
        if user_type == "pet_owner":
            # Pet owner booking stats
            bookings_result = await db.table("bookings").select("*").eq("pet_owner_id", user_id).execute()
            bookings = bookings_result.data or []
            
            stats["total_bookings"] = len(bookings)
            stats["pending_bookings"] = len([b for b in bookings if b.get("booking_status") == "pending"])
            stats["confirmed_bookings"] = len([b for b in bookings if b.get("booking_status") == "confirmed"])
            stats["completed_bookings"] = len([b for b in bookings if b.get("booking_status") == "completed"])
            stats["cancelled_bookings"] = len([b for b in bookings if b.get("booking_status") == "cancelled"])
            
        elif user_type == "caregiver":
            # Caregiver booking stats
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", user_id).execute()
            if not profile_result.data:
                return {"error": "Caregiver profile not found"}
            
            caregiver_id = profile_result.data[0]["id"]
            bookings_result = await db.table("bookings").select("*").eq("caregiver_id", caregiver_id).execute()
            bookings = bookings_result.data or []
            
            stats["total_bookings"] = len(bookings)
            stats["pending_bookings"] = len([b for b in bookings if b.get("booking_status") == "pending"])
            stats["confirmed_bookings"] = len([b for b in bookings if b.get("booking_status") == "confirmed"])
            stats["completed_bookings"] = len([b for b in bookings if b.get("booking_status") == "completed"])
            stats["rejected_bookings"] = len([b for b in bookings if b.get("booking_status") == "rejected"])
        
        # Common stats
        current_time = datetime.utcnow().isoformat()
        
        # Today's bookings
        today = datetime.utcnow().date()
        today_bookings = [
            b for b in bookings 
            if datetime.fromisoformat(b.get("start_datetime", "").replace('Z', '+00:00')).date() == today
        ]
        stats["today_bookings"] = len(today_bookings)
        
        # This week's bookings
        week_start = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        week_bookings = [
            b for b in bookings 
            if datetime.fromisoformat(b.get("start_datetime", "").replace('Z', '+00:00')) >= week_start
        ]
        stats["this_week_bookings"] = len(week_bookings)
        
        return stats
        
    except Exception as e:
        logger.error(f"Get booking stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get booking statistics")