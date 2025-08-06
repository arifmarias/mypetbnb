# backend/pets_endpoints.py
"""
Pet management API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
import uuid
import logging
from database import get_db_client
from auth import get_current_user
from models import PetCreate, PetUpdate, PetResponse
import json
from datetime import datetime
import cloudinary.uploader

logger = logging.getLogger(__name__)

pets_router = APIRouter(prefix="/api/pets", tags=["pets"])

@pets_router.get("/", response_model=List[PetResponse])
async def get_user_pets(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client),
    active_only: bool = True
):
    """Get all pets for the current user"""
    try:
        user_id = current_user["user_id"]
        
        query = db.table("pets").select("*").eq("owner_id", user_id)
        
        if active_only:
            query = query.eq("is_active", True)
        
        result = await query.execute()
        
        if not result.data:
            return []
        
        # Transform database data to response format
        pets = []
        for pet_data in result.data:
            # Parse JSON fields
            try:
                medical_info = json.loads(pet_data.get("medical_info", "{}")) if pet_data.get("medical_info") else {}
                behavioral_notes = json.loads(pet_data.get("behavioral_notes", "{}")) if pet_data.get("behavioral_notes") else {}
                emergency_contact = json.loads(pet_data.get("emergency_contact", "{}")) if pet_data.get("emergency_contact") else {}
            except json.JSONDecodeError:
                medical_info = {}
                behavioral_notes = {}
                emergency_contact = {}
            
            pet = {
                "id": pet_data["id"],
                "name": pet_data["name"],
                "species": pet_data.get("species", "dog"),
                "breed": pet_data.get("breed"),
                "age": pet_data.get("age"),
                "weight": pet_data.get("weight"),
                "gender": pet_data.get("gender", "unknown"),
                "description": pet_data.get("description"),
                "images": pet_data.get("images", []),
                "medical_info": medical_info,
                "behavioral_notes": behavioral_notes,
                "emergency_contact": emergency_contact,
                "is_active": pet_data.get("is_active", True),
                "created_at": pet_data.get("created_at"),
                "updated_at": pet_data.get("updated_at"),
                "owner_id": pet_data["owner_id"]
            }
            pets.append(pet)
        
        logger.info(f"Retrieved {len(pets)} pets for user {user_id}")
        return pets
        
    except Exception as e:
        logger.error(f"Error retrieving user pets: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pets")

@pets_router.get("/{pet_id}", response_model=PetResponse)
async def get_pet_by_id(
    pet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Get a specific pet by ID"""
    try:
        user_id = current_user["user_id"]
        
        result = await db.table("pets").select("*").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        pet_data = result.data[0]
        
        # Parse JSON fields
        try:
            medical_info = json.loads(pet_data.get("medical_info", "{}")) if pet_data.get("medical_info") else {}
            behavioral_notes = json.loads(pet_data.get("behavioral_notes", "{}")) if pet_data.get("behavioral_notes") else {}
            emergency_contact = json.loads(pet_data.get("emergency_contact", "{}")) if pet_data.get("emergency_contact") else {}
        except json.JSONDecodeError:
            medical_info = {}
            behavioral_notes = {}
            emergency_contact = {}
        
        pet = {
            "id": pet_data["id"],
            "name": pet_data["name"],
            "species": pet_data.get("species", "dog"),
            "breed": pet_data.get("breed"),
            "age": pet_data.get("age"),
            "weight": pet_data.get("weight"),
            "gender": pet_data.get("gender", "unknown"),
            "description": pet_data.get("description"),
            "images": pet_data.get("images", []),
            "medical_info": medical_info,
            "behavioral_notes": behavioral_notes,
            "emergency_contact": emergency_contact,
            "is_active": pet_data.get("is_active", True),
            "created_at": pet_data.get("created_at"),
            "updated_at": pet_data.get("updated_at"),
            "owner_id": pet_data["owner_id"]
        }
        
        logger.info(f"Retrieved pet {pet_id} for user {user_id}")
        return pet
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pet")

@pets_router.post("/", response_model=PetResponse)
async def create_pet(
    pet_data: PetCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Create a new pet"""
    try:
        user_id = current_user["user_id"]
        
        # Generate new pet ID
        pet_id = str(uuid.uuid4())
        
        # Debug logging
        logger.info(f"Creating pet for user {user_id}")
        logger.info(f"Pet data received: {pet_data.dict()}")
        
        # Prepare data for database
        db_pet_data = {
            "id": pet_id,
            "owner_id": user_id,  # Set from authenticated user
            "name": pet_data.name.strip(),
            "species": pet_data.species or "dog",
            "breed": pet_data.breed.strip() if pet_data.breed else None,
            "age": pet_data.age,
            "weight": pet_data.weight,
            "gender": pet_data.gender or "unknown",
            "description": pet_data.description.strip() if pet_data.description else None,
            "images": pet_data.images or [],
            "medical_info": json.dumps(pet_data.medical_info) if pet_data.medical_info else "{}",
            "behavioral_notes": json.dumps(pet_data.behavioral_notes) if pet_data.behavioral_notes else "{}",
            "emergency_contact": json.dumps(pet_data.emergency_contact) if pet_data.emergency_contact else "{}",
            "vaccination_records": json.dumps(pet_data.vaccination_records) if pet_data.vaccination_records else "{}",
            "special_needs": json.dumps(pet_data.special_needs) if pet_data.special_needs else "{}",
            "is_active": pet_data.is_active,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Database insert data: {db_pet_data}")
        
        result = await db.table("pets").insert(db_pet_data).execute()
        
        if not result.data:
            logger.error("Database insert failed - no data returned")
            raise HTTPException(status_code=500, detail="Failed to create pet")
        
        created_pet = result.data[0]
        logger.info(f"Pet created successfully: {created_pet['id']}")
        
        # Return formatted response
        response_pet = {
            "id": created_pet["id"],
            "owner_id": created_pet["owner_id"],
            "name": created_pet["name"],
            "species": created_pet["species"],
            "breed": created_pet.get("breed"),
            "age": created_pet.get("age"),
            "weight": created_pet.get("weight"),
            "gender": created_pet.get("gender", "unknown"),
            "description": created_pet.get("description"),
            "images": created_pet.get("images", []),
            "medical_info": json.loads(created_pet.get("medical_info", "{}")),
            "behavioral_notes": json.loads(created_pet.get("behavioral_notes", "{}")),
            "emergency_contact": json.loads(created_pet.get("emergency_contact", "{}")),
            "vaccination_records": json.loads(created_pet.get("vaccination_records", "{}")),
            "special_needs": json.loads(created_pet.get("special_needs", "{}")),
            "is_active": created_pet.get("is_active", True),
            "created_at": created_pet.get("created_at"),
            "updated_at": created_pet.get("updated_at")
        }
        
        logger.info(f"Created new pet {pet_id} for user {user_id}")
        return response_pet
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating pet: {e}")
        logger.error(f"Pet data that caused error: {pet_data.dict()}")
        raise HTTPException(status_code=500, detail=f"Failed to create pet: {str(e)}")

# Also add this debug endpoint to help troubleshoot
@pets_router.post("/debug", include_in_schema=False)
async def debug_pet_creation(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to see what data is being received"""
    try:
        logger.info(f"Debug - User: {current_user}")
        logger.info(f"Debug - Request data: {request_data}")
        
        # Try to create PetCreate model from request
        pet_create = PetCreate(**request_data)
        logger.info(f"Debug - PetCreate model: {pet_create.dict()}")
        
        return {
            "status": "success",
            "user": current_user,
            "received_data": request_data,
            "parsed_model": pet_create.dict()
        }
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "user": current_user,
            "received_data": request_data
        }

@pets_router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: uuid.UUID,
    pet_data: PetUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Update an existing pet"""
    try:
        user_id = current_user["user_id"]
        
        # Check if pet exists and belongs to user
        existing_result = await db.table("pets").select("*").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not existing_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        # Only update fields that are provided
        if pet_data.name is not None:
            update_data["name"] = pet_data.name
        if pet_data.species is not None:
            update_data["species"] = pet_data.species
        if pet_data.breed is not None:
            update_data["breed"] = pet_data.breed
        if pet_data.age is not None:
            update_data["age"] = pet_data.age
        if pet_data.weight is not None:
            update_data["weight"] = pet_data.weight
        if pet_data.gender is not None:
            update_data["gender"] = pet_data.gender.value
        if pet_data.description is not None:
            update_data["description"] = pet_data.description
        if pet_data.images is not None:
            update_data["images"] = pet_data.images
        if pet_data.medical_info is not None:
            update_data["medical_info"] = json.dumps(pet_data.medical_info)
        if pet_data.behavioral_notes is not None:
            update_data["behavioral_notes"] = json.dumps(pet_data.behavioral_notes)
        if pet_data.emergency_contact is not None:
            update_data["emergency_contact"] = json.dumps(pet_data.emergency_contact)
        if pet_data.is_active is not None:
            update_data["is_active"] = pet_data.is_active
        
        result = await db.table("pets").update(update_data).eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update pet")
        
        updated_pet = result.data[0]
        
        # Return formatted response
        response_pet = {
            "id": updated_pet["id"],
            "name": updated_pet["name"],
            "species": updated_pet["species"],
            "breed": updated_pet.get("breed"),
            "age": updated_pet.get("age"),
            "weight": updated_pet.get("weight"),
            "gender": updated_pet.get("gender", "unknown"),
            "description": updated_pet.get("description"),
            "images": updated_pet.get("images", []),
            "medical_info": json.loads(updated_pet.get("medical_info", "{}")),
            "behavioral_notes": json.loads(updated_pet.get("behavioral_notes", "{}")),
            "emergency_contact": json.loads(updated_pet.get("emergency_contact", "{}")),
            "is_active": updated_pet.get("is_active", True),
            "created_at": updated_pet.get("created_at"),
            "updated_at": updated_pet.get("updated_at"),
            "owner_id": updated_pet["owner_id"]
        }
        
        logger.info(f"Updated pet {pet_id} for user {user_id}")
        return response_pet
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update pet")

@pets_router.delete("/{pet_id}")
async def delete_pet(
    pet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Delete a pet (soft delete by setting is_active to False)"""
    try:
        user_id = current_user["user_id"]
        
        # Check if pet exists and belongs to user
        existing_result = await db.table("pets").select("id, name").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not existing_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        pet_name = existing_result.data[0]["name"]
        
        # Check for active bookings
        active_bookings = await db.table("bookings").select("id").contains("pet_ids", [str(pet_id)]).in_("booking_status", ["pending", "confirmed", "in_progress"]).execute()
        
        if active_bookings.data:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete {pet_name}. Pet has active bookings. Please cancel or complete them first."
            )
        
        # Soft delete by setting is_active to False
        result = await db.table("pets").update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to delete pet")
        
        logger.info(f"Deleted pet {pet_id} ({pet_name}) for user {user_id}")
        return {"message": f"Pet {pet_name} has been removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete pet")

@pets_router.post("/{pet_id}/upload-image")
async def upload_pet_image(
    pet_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Upload an image for a pet"""
    try:
        user_id = current_user["user_id"]
        
        # Check if pet exists and belongs to user
        existing_result = await db.table("pets").select("id, images").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not existing_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Upload to Cloudinary
        file_content = await file.read()
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder="pets",
            public_id=f"pet_{pet_id}_{int(datetime.utcnow().timestamp())}",
            resource_type="image"
        )
        
        image_url = upload_result.get("secure_url")
        
        # Update pet's images array
        current_images = existing_result.data[0].get("images", [])
        current_images.append(image_url)
        
        result = await db.table("pets").update({
            "images": current_images,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update pet with image")
        
        logger.info(f"Uploaded image for pet {pet_id}")
        return {
            "message": "Image uploaded successfully",
            "image_url": image_url,
            "total_images": len(current_images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image for pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@pets_router.delete("/{pet_id}/images/{image_index}")
async def delete_pet_image(
    pet_id: uuid.UUID,
    image_index: int,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Delete a specific image from a pet's gallery"""
    try:
        user_id = current_user["user_id"]
        
        # Get current pet data
        existing_result = await db.table("pets").select("id, images").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not existing_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        current_images = existing_result.data[0].get("images", [])
        
        if image_index < 0 or image_index >= len(current_images):
            raise HTTPException(status_code=400, detail="Invalid image index")
        
        # Remove image from array
        removed_image = current_images.pop(image_index)
        
        # Update database
        result = await db.table("pets").update({
            "images": current_images,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to remove image")
        
        logger.info(f"Removed image {image_index} from pet {pet_id}")
        return {
            "message": "Image removed successfully",
            "removed_image": removed_image,
            "remaining_images": len(current_images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing image from pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove image")

@pets_router.get("/{pet_id}/bookings")
async def get_pet_bookings(
    pet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client),
    status_filter: Optional[str] = None
):
    """Get all bookings for a specific pet"""
    try:
        user_id = current_user["user_id"]
        
        # Verify pet ownership
        pet_result = await db.table("pets").select("id, name").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not pet_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Build query
        query = db.table("bookings").select("""
            *,
            caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name, profile_image_url)),
            caregiver_services(service_name, title, service_type)
        """).contains("pet_ids", [str(pet_id)])
        
        if status_filter:
            query = query.eq("booking_status", status_filter)
        
        result = await query.order("start_datetime", desc=True).execute()
        
        bookings = result.data or []
        
        logger.info(f"Retrieved {len(bookings)} bookings for pet {pet_id}")
        return bookings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving bookings for pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pet bookings")

@pets_router.get("/{pet_id}/medical-history")
async def get_pet_medical_history(
    pet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Get medical history for a pet"""
    try:
        user_id = current_user["user_id"]
        
        # Get pet with medical info
        result = await db.table("pets").select("id, name, medical_info, vaccination_records").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        pet_data = result.data[0]
        
        # Parse medical information
        try:
            medical_info = json.loads(pet_data.get("medical_info", "{}"))
            vaccination_records = json.loads(pet_data.get("vaccination_records", "{}")) if pet_data.get("vaccination_records") else {}
        except json.JSONDecodeError:
            medical_info = {}
            vaccination_records = {}
        
        # Get any medical-related booking notes
        medical_bookings = await db.table("bookings").select(
            "id, start_datetime, special_requirements, service_notes"
        ).contains("pet_ids", [str(pet_id)]).eq("booking_status", "completed").execute()
        
        medical_notes = []
        for booking in (medical_bookings.data or []):
            if booking.get("service_notes") and "medical" in booking.get("service_notes", "").lower():
                medical_notes.append({
                    "date": booking["start_datetime"],
                    "notes": booking["service_notes"],
                    "booking_id": booking["id"]
                })
        
        return {
            "pet_id": pet_data["id"],
            "pet_name": pet_data["name"],
            "medical_info": medical_info,
            "vaccination_records": vaccination_records,
            "service_medical_notes": medical_notes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving medical history for pet {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve medical history")

@pets_router.get("/{pet_id}/stats")
async def get_pet_statistics(
    pet_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_client)
):
    """Get statistics for a specific pet"""
    try:
        user_id = current_user["user_id"]
        
        # Verify pet ownership
        pet_result = await db.table("pets").select("id, name, created_at").eq("id", str(pet_id)).eq("owner_id", user_id).execute()
        
        if not pet_result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        pet_data = pet_result.data[0]
        
        # Get booking statistics
        bookings_result = await db.table("bookings").select("id, booking_status, total_amount").contains("pet_ids", [str(pet_id)]).execute()
        bookings = bookings_result.data or []
        
        # Calculate stats
        total_bookings = len(bookings)
        completed_bookings = len([b for b in bookings if b.get("booking_status") == "completed"])
        total_spent = sum(float(b.get("total_amount", 0)) for b in bookings if b.get("booking_status") == "completed")
        
        # Get upcoming bookings
        current_time = datetime.utcnow().isoformat()
        upcoming_result = await db.table("bookings").select("id").contains("pet_ids", [str(pet_id)]).gte("start_datetime", current_time).in_("booking_status", ["pending", "confirmed"]).execute()
        upcoming_bookings = len(upcoming_result.data or [])
        
        # Get favorite caregivers (most frequent)
        completed_bookings_result = await db.table("bookings").select("caregiver_service_id").contains("pet_ids", [str(pet_id)]).eq("booking_status", "completed").execute()
        caregiver_frequency = {}
        for booking in (completed_bookings_result.data or []):
            service_id = booking.get("caregiver_service_id")
            if service_id:
                caregiver_frequency[service_id] = caregiver_frequency.get(service_id, 0) + 1
        
        favorite_caregivers = len(set(caregiver_frequency.keys()))
        
        return {
            "pet_id": pet_data["id"],
            "pet_name": pet_data["name"],
            "member_since": pet_data["created_at"],
            "total_bookings": total_bookings,
            "completed_bookings": completed_bookings,
            "upcoming_bookings": upcoming_bookings,
            "total_spent": total_spent,
            "favorite_caregivers": favorite_caregivers,
            "booking_success_rate": round((completed_bookings / total_bookings * 100) if total_bookings > 0 else 0, 1)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving pet statistics for {pet_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pet statistics")