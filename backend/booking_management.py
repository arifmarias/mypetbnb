# backend/booking_management.py
"""
Enhanced booking management system with real-time updates and advanced features
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum
import uuid
import logging
from database import get_db_client
from auth import get_current_user
from models import BookingStatus, PaymentStatus
import asyncio

logger = logging.getLogger(__name__)

booking_router = APIRouter(prefix="/api/bookings", tags=["bookings"])

class BookingFilters(str, Enum):
    ALL = "all"
    UPCOMING = "upcoming"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

@booking_router.get("/filter/{filter_type}")
async def get_filtered_bookings(
    filter_type: BookingFilters,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client),
    limit: int = 50,
    offset: int = 0
):
    """Get bookings filtered by status/type"""
    try:
        current_time = datetime.utcnow().isoformat()
        
        # Build base query based on user type
        if current_user.get("user_type") == "pet_owner":
            base_query = db.table("bookings").select("""
                *,
                caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name, profile_image_url)),
                pets(name, species, breed, images),
                caregiver_services(service_name, title, service_type)
            """).eq("pet_owner_id", current_user["user_id"])
        else:
            # Get caregiver profile first
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
            if not profile_result.data:
                return []
            
            caregiver_id = profile_result.data[0]["id"]
            base_query = db.table("bookings").select("""
                *,
                users!bookings_pet_owner_id_fkey(first_name, last_name, profile_image_url),
                pets(name, species, breed, images),
                caregiver_services(service_name, title, service_type)
            """).eq("caregiver_id", caregiver_id)
        
        # Apply filters
        if filter_type == BookingFilters.UPCOMING:
            result = await base_query.gte("start_datetime", current_time).in_(
                "booking_status", ["pending", "confirmed", "in_progress"]
            ).order("start_datetime").range(offset, offset + limit - 1).execute()
        elif filter_type == BookingFilters.PENDING:
            result = await base_query.eq("booking_status", "pending").order(
                "created_at", desc=True
            ).range(offset, offset + limit - 1).execute()
        elif filter_type == BookingFilters.CONFIRMED:
            result = await base_query.eq("booking_status", "confirmed").order(
                "start_datetime"
            ).range(offset, offset + limit - 1).execute()
        elif filter_type == BookingFilters.IN_PROGRESS:
            result = await base_query.eq("booking_status", "in_progress").order(
                "start_datetime"
            ).range(offset, offset + limit - 1).execute()
        elif filter_type == BookingFilters.COMPLETED:
            result = await base_query.eq("booking_status", "completed").order(
                "end_datetime", desc=True
            ).range(offset, offset + limit - 1).execute()
        elif filter_type == BookingFilters.CANCELLED:
            result = await base_query.in_(
                "booking_status", ["cancelled", "rejected"]
            ).order("updated_at", desc=True).range(offset, offset + limit - 1).execute()
        else:  # ALL
            result = await base_query.order(
                "created_at", desc=True
            ).range(offset, offset + limit - 1).execute()
        
        return {
            "bookings": result.data or [],
            "total": len(result.data or []),
            "filter": filter_type,
            "has_more": len(result.data or []) == limit
        }
        
    except Exception as e:
        logger.error(f"Get filtered bookings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get bookings")

@booking_router.post("/{booking_id}/actions/confirm")
async def confirm_booking(
    booking_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Caregiver confirms a pending booking"""
    try:
        # Get booking with related data
        booking_result = await db.table("bookings").select("""
            *,
            users!bookings_pet_owner_id_fkey(first_name, last_name, email),
            caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name)),
            caregiver_services(service_name, title),
            pets(name, breed)
        """).eq("id", booking_id).execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check authorization
        if booking["caregiver_profiles"]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if booking["booking_status"] != "pending":
            raise HTTPException(status_code=400, detail="Only pending bookings can be confirmed")
        
        # Update booking status
        update_result = await db.table("bookings").update({
            "booking_status": "confirmed",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", booking_id).execute()
        
        if not update_result.data:
            raise HTTPException(status_code=500, detail="Failed to confirm booking")
        
        # Send confirmation email
        background_tasks.add_task(
            send_booking_confirmation_email,
            booking["users"]["email"],
            booking["users"]["first_name"],
            booking["caregiver_profiles"]["users"]["first_name"],
            booking["caregiver_services"]["title"],
            booking["start_datetime"],
            booking["total_amount"]
        )
        
        return {
            "message": "Booking confirmed successfully",
            "booking_id": booking_id,
            "status": "confirmed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirm booking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to confirm booking")

@booking_router.post("/{booking_id}/actions/start-service")
async def start_service(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Mark service as started"""
    try:
        booking_result = await db.table("bookings").select("""
            *,
            caregiver_profiles!inner(user_id)
        """).eq("id", booking_id).execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check authorization
        if booking["caregiver_profiles"]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if booking["booking_status"] != "confirmed":
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be started")
        
        # Check if service time has arrived (within 30 minutes)
        start_time = datetime.fromisoformat(booking["start_datetime"].replace('Z', '+00:00'))
        current_time = datetime.utcnow().replace(tzinfo=start_time.tzinfo)
        time_diff = (start_time - current_time).total_seconds() / 60  # in minutes
        
        if time_diff > 30:
            raise HTTPException(
                status_code=400, 
                detail="Service can only be started within 30 minutes of scheduled time"
            )
        
        # Update status
        update_result = await db.table("bookings").update({
            "booking_status": "in_progress",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", booking_id).execute()
        
        return {
            "message": "Service started successfully",
            "booking_id": booking_id,
            "status": "in_progress",
            "started_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Start service error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start service")

@booking_router.post("/{booking_id}/actions/complete")
async def complete_service(
    booking_id: str,
    completion_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Mark service as completed with optional notes/photos"""
    try:
        service_notes = completion_data.get("service_notes", "")
        completion_photos = completion_data.get("completion_photos", [])
        
        booking_result = await db.table("bookings").select("""
            *,
            users!bookings_pet_owner_id_fkey(first_name, email),
            caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name)),
            caregiver_services(title),
            pets(name)
        """).eq("id", booking_id).execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check authorization
        if booking["caregiver_profiles"]["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if booking["booking_status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Only in-progress bookings can be completed")
        
        # Update booking with completion data
        update_data = {
            "booking_status": "completed",
            "payment_status": "completed",  # Auto-complete payment
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if service_notes:
            update_data["special_requirements"] = f"{booking.get('special_requirements', '')}\n\nService Notes: {service_notes}".strip()
        
        update_result = await db.table("bookings").update(update_data).eq("id", booking_id).execute()
        
        # Send completion email with review request
        background_tasks.add_task(
            send_service_completion_email,
            booking["users"]["email"],
            booking["users"]["first_name"],
            booking["caregiver_profiles"]["users"]["first_name"],
            booking["caregiver_services"]["title"],
            booking["pets"]["name"],
            service_notes,
            completion_photos
        )
        
        return {
            "message": "Service completed successfully",
            "booking_id": booking_id,
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "payment_processed": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Complete service error: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete service")

@booking_router.get("/{booking_id}/timeline")
async def get_booking_timeline(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Get booking timeline/history"""
    try:
        # Get booking
        booking_result = await db.table("bookings").select("*").eq("id", booking_id).execute()
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check authorization
        is_pet_owner = booking["pet_owner_id"] == current_user["user_id"]
        is_caregiver = False
        
        if not is_pet_owner:
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
            if profile_result.data:
                is_caregiver = booking["caregiver_id"] == profile_result.data[0]["id"]
        
        if not (is_pet_owner or is_caregiver):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Build timeline
        timeline = [
            {
                "event": "booking_created",
                "timestamp": booking["created_at"],
                "title": "Booking Created",
                "description": "Booking request submitted",
                "icon": "calendar-plus"
            }
        ]
        
        if booking["booking_status"] in ["confirmed", "in_progress", "completed"]:
            timeline.append({
                "event": "booking_confirmed",
                "timestamp": booking.get("updated_at", booking["created_at"]),
                "title": "Booking Confirmed",
                "description": "Caregiver accepted the booking",
                "icon": "check-circle"
            })
        
        if booking["booking_status"] in ["in_progress", "completed"]:
            timeline.append({
                "event": "service_started",
                "timestamp": booking.get("updated_at"),
                "title": "Service Started",
                "description": "Pet care service began",
                "icon": "play-circle"
            })
        
        if booking["booking_status"] == "completed":
            timeline.append({
                "event": "service_completed",
                "timestamp": booking.get("updated_at"),
                "title": "Service Completed",
                "description": "Pet care service finished successfully",
                "icon": "check-done-circle"
            })
        
        if booking["booking_status"] in ["cancelled", "rejected"]:
            timeline.append({
                "event": f"booking_{booking['booking_status']}",
                "timestamp": booking.get("updated_at"),
                "title": f"Booking {booking['booking_status'].title()}",
                "description": f"Booking was {booking['booking_status']}",
                "icon": "close-circle"
            })
        
        return {
            "booking_id": booking_id,
            "timeline": timeline,
            "current_status": booking["booking_status"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get booking timeline error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get booking timeline")

# Email functions
async def send_booking_confirmation_email(email: str, pet_owner_name: str, caregiver_name: str, service_title: str, start_datetime: str, total_amount: float):
    """Send booking confirmation email"""
    try:
        from server import send_email
        start_date = datetime.fromisoformat(start_datetime.replace('Z', '+00:00')).strftime("%B %d, %Y at %I:%M %p")
        
        await send_email(
            email,
            "Booking Confirmed! 🎉",
            f"""
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #FF5A5F; color: white; padding: 20px; text-align: center;">
                    <h1>🎉 Booking Confirmed!</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2>Hi {pet_owner_name}!</h2>
                    <p>Great news! <strong>{caregiver_name}</strong> has confirmed your booking for <strong>{service_title}</strong>.</p>
                    
                    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>📅 Booking Details:</h3>
                        <p><strong>Service:</strong> {service_title}</p>
                        <p><strong>Date & Time:</strong> {start_date}</p>
                        <p><strong>Total Amount:</strong> ${total_amount}</p>
                    </div>
                    
                    <p>You can now message your caregiver directly through the app. We'll send you a reminder before your appointment!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #666;">Thank you for choosing PetBnB! 🐾</p>
                    </div>
                </div>
            </div>
            """
        )
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

async def send_service_completion_email(email: str, pet_owner_name: str, caregiver_name: str, service_title: str, pet_name: str, service_notes: str, completion_photos: list):
    """Send service completion email with review request"""
    try:
        from server import send_email
        
        photos_html = ""
        if completion_photos:
            photos_html = "<div style='margin: 20px 0;'><h4>Service Photos:</h4>"
            for photo in completion_photos[:3]:  # Limit to 3 photos
                photos_html += f"<img src='{photo}' style='max-width: 200px; margin: 5px; border-radius: 8px;'>"
            photos_html += "</div>"
        
        notes_html = ""
        if service_notes:
            notes_html = f"""
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>Service Notes from {caregiver_name}:</h4>
                <p style="margin: 0; font-style: italic;">"{service_notes}"</p>
            </div>
            """
        
        await send_email(
            email,
            "Service Completed! Please Leave a Review ⭐",
            f"""
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
                    <h1>✅ Service Completed!</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2>Hi {pet_owner_name}!</h2>
                    <p>Your <strong>{service_title}</strong> service with <strong>{caregiver_name}</strong> has been completed successfully!</p>
                    <p>We hope {pet_name} had a wonderful experience! 🐾</p>
                    
                    {notes_html}
                    {photos_html}
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                        <h3 style="color: #856404; margin: 0 0 15px 0;">⭐ Please Rate Your Experience</h3>
                        <p style="color: #856404; margin: 0;">Your review helps other pet owners and supports your caregiver!</p>
                    </div>
                    
                    <p style="text-align: center; color: #666;">Payment has been processed automatically. Thank you for using PetBnB!</p>
                </div>
            </div>
            """
        )
    except Exception as e:
        logger.error(f"Failed to send completion email: {e}")