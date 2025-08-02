from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv
import stripe
import cloudinary
import cloudinary.uploader
from geopy.distance import geodesic
import googlemaps
import smtplib
try:
    from email.mime.text import MimeText
    from email.mime.multipart import MimeMultipart
except ImportError:
    # Fallback for different Python versions
    from email.mime.text import MIMEText as MimeText
    from email.mime.multipart import MIMEMultipart as MimeMultipart
import asyncio
import httpx
from enum import Enum
import logging

# Import new Supabase modules
from database import get_db_client, startup_event, shutdown_event
from models import (
    UserCreate, UserUpdate, UserResponse, UserLogin, LoginResponse,
    PetCreate, PetUpdate, PetResponse,
    CaregiverServiceCreate, CaregiverServiceResponse, CaregiverProfileResponse,
    BookingCreate, BookingResponse, BookingStatus, PaymentStatus,
    ReviewCreate, ReviewResponse,
    MessageCreate, MessageResponse,
    LocationSearch, ServiceType
)
from auth import AuthService, get_current_user

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'])

# External service configurations
stripe.api_key = os.environ['STRIPE_SECRET_KEY']
gmaps = googlemaps.Client(key=os.environ['GOOGLE_MAPS_API_KEY'])
cloudinary.config(
    cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'],
    api_key=os.environ['CLOUDINARY_API_KEY'],
    api_secret=os.environ['CLOUDINARY_API_SECRET']
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# FastAPI app
app = FastAPI(title="PetBnB API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup and shutdown events
app.add_event_handler("startup", startup_event)
app.add_event_handler("shutdown", shutdown_event)

# Utility functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def calculate_distance(lat1, lon1, lat2, lon2):
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

async def send_email(to_email: str, subject: str, body: str):
    try:
        smtp_server = os.environ['SMTP_SERVER']
        smtp_port = int(os.environ['SMTP_PORT'])
        smtp_username = os.environ['SMTP_USERNAME']
        smtp_password = os.environ['SMTP_PASSWORD']
        from_email = os.environ['FROM_EMAIL']
        
        msg = MimeMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MimeText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

# Authentication endpoints
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db=Depends(get_db_client)):
    try:
        # Check if user already exists
        existing_user = await db.table("users").select("*").eq("email", user_data.email).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        user_dict = user_data.dict()
        user_dict.pop('password')
        user_dict['password_hash'] = hashed_password
        user_dict['id'] = str(uuid.uuid4())
        user_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = await db.table("users").insert(user_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        created_user = result.data[0]
        
        # Create caregiver profile if role is caregiver
        if user_data.user_type == "caregiver":
            caregiver_profile = {
                "id": str(uuid.uuid4()),
                "user_id": created_user['id'],
                "bio": "",
                "experience_years": 0,
                "certifications": {},
                "portfolio_images": [],
                "availability_schedule": {},
                "rating": 0.0,
                "total_reviews": 0,
                "background_check_verified": False,
                "insurance_info": None,
                "created_at": datetime.utcnow().isoformat()
            }
            await db.table("caregiver_profiles").insert(caregiver_profile).execute()
        
        # Send welcome email
        background_tasks.add_task(
            send_email,
            user_data.email,
            "Welcome to PetBnB!",
            f"<h1>Welcome {user_data.first_name}!</h1><p>Thanks for joining PetBnB. We're excited to have you on board!</p>"
        )
        
        access_token = create_access_token(data={"sub": user_data.email, "user_id": created_user['id'], "user_type": user_data.user_type})
        return {"access_token": access_token, "token_type": "bearer", "user_id": created_user['id']}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login", response_model=dict)
async def login(user_credentials: UserLogin, db=Depends(get_db_client)):
    try:
        result = await db.table("users").select("*").eq("email", user_credentials.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        user = result.data[0]
        if not verify_password(user_credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": user_credentials.email, "user_id": user["id"], "user_type": user["user_type"]})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user["id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        result = await db.table("users").select("*").eq("id", current_user["user_id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = result.data[0]
        return UserResponse(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user info")

# Pet management endpoints
@api_router.post("/pets", response_model=PetResponse)
async def create_pet(pet_data: PetCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        if current_user.get("user_type") != "pet_owner":
            raise HTTPException(status_code=403, detail="Only pet owners can create pets")
        
        pet_dict = pet_data.dict()
        pet_dict['id'] = str(uuid.uuid4())
        pet_dict['owner_id'] = str(pet_dict['owner_id'])
        pet_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = await db.table("pets").insert(pet_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create pet")
        
        return PetResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create pet error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pet")

@api_router.get("/pets", response_model=List[PetResponse])
async def get_user_pets(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        result = await db.table("pets").select("*").eq("owner_id", current_user["user_id"]).eq("is_active", True).execute()
        pets = result.data or []
        return [PetResponse(**pet) for pet in pets]
        
    except Exception as e:
        logger.error(f"Get pets error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pets")

@api_router.get("/pets/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        result = await db.table("pets").select("*").eq("id", pet_id).eq("owner_id", current_user["user_id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        return PetResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get pet error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pet")

# Caregiver service endpoints
@api_router.post("/caregiver/services", response_model=CaregiverServiceResponse)
async def create_service(service_data: CaregiverServiceCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        if current_user.get("user_type") != "caregiver":
            raise HTTPException(status_code=403, detail="Only caregivers can create services")
        
        service_dict = service_data.dict()
        service_dict['id'] = str(uuid.uuid4())
        service_dict['caregiver_id'] = str(service_dict['caregiver_id'])
        service_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = await db.table("caregiver_services").insert(service_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create service")
        
        return CaregiverServiceResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create service error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create service")

@api_router.get("/caregiver/services", response_model=List[CaregiverServiceResponse])
async def get_caregiver_services(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        # Get caregiver profile first
        profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
        if not profile_result.data:
            return []
        
        caregiver_id = profile_result.data[0]["id"]
        result = await db.table("caregiver_services").select("*").eq("caregiver_id", caregiver_id).execute()
        services = result.data or []
        return [CaregiverServiceResponse(**service) for service in services]
        
    except Exception as e:
        logger.error(f"Get caregiver services error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get services")

@api_router.post("/search/location", response_model=List[dict])
async def search_caregivers_by_location(search_params: LocationSearch, db=Depends(get_db_client)):
    try:
        # Get all active caregiver services
        services_result = await db.table("caregiver_services").select("*").eq("is_active", True).execute()
        services = services_result.data or []
        
        caregivers = []
        
        for service in services:
            # Get caregiver profile
            profile_result = await db.table("caregiver_profiles").select("*").eq("id", service["caregiver_id"]).execute()
            if not profile_result.data:
                continue
            profile = profile_result.data[0]
            
            # Get caregiver user info
            user_result = await db.table("users").select("*").eq("id", profile["user_id"]).execute()
            if not user_result.data:
                continue
            caregiver = user_result.data[0]
            
            if not caregiver.get("latitude") or not caregiver.get("longitude"):
                continue
            
            # Calculate distance
            distance = calculate_distance(
                search_params.latitude, search_params.longitude,
                caregiver["latitude"], caregiver["longitude"]
            )
            
            if distance <= search_params.radius:
                # Apply filters
                if search_params.service_type and service["service_type"] != search_params.service_type:
                    continue
                if search_params.max_price and service["base_price"] > search_params.max_price:
                    continue
                if search_params.min_rating and profile.get("rating", 0) < search_params.min_rating:
                    continue
                
                caregivers.append({
                    "caregiver": caregiver,
                    "service": service,
                    "profile": profile,
                    "distance": round(distance, 2)
                })
        
        # Sort by distance
        caregivers.sort(key=lambda x: x["distance"])
        return caregivers[:50]  # Limit to 50 results
        
    except Exception as e:
        logger.error(f"Location search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

# Booking endpoints
@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        if current_user.get("user_type") != "pet_owner":
            raise HTTPException(status_code=403, detail="Only pet owners can create bookings")
        
        # Get service details
        service_result = await db.table("caregiver_services").select("*").eq("id", str(booking_data.service_id)).execute()
        if not service_result.data:
            raise HTTPException(status_code=404, detail="Service not found")
        
        service = service_result.data[0]
        
        booking_dict = booking_data.dict()
        booking_dict['id'] = str(uuid.uuid4())
        booking_dict['pet_owner_id'] = str(booking_dict['pet_owner_id'])
        booking_dict['caregiver_id'] = str(booking_dict['caregiver_id'])
        booking_dict['pet_id'] = str(booking_dict['pet_id'])
        booking_dict['service_id'] = str(booking_dict['service_id'])
        booking_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = await db.table("bookings").insert(booking_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create booking")
        
        return BookingResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create booking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

@api_router.get("/bookings", response_model=List[BookingResponse])
async def get_user_bookings(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        if current_user.get("user_type") == "pet_owner":
            result = await db.table("bookings").select("*").eq("pet_owner_id", current_user["user_id"]).execute()
        elif current_user.get("user_type") == "caregiver":
            # Get caregiver profile first
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
            if not profile_result.data:
                return []
            caregiver_id = profile_result.data[0]["id"]
            result = await db.table("bookings").select("*").eq("caregiver_id", caregiver_id).execute()
        else:
            return []
        
        bookings = result.data or []
        return [BookingResponse(**booking) for booking in bookings]
        
    except Exception as e:
        logger.error(f"Get bookings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get bookings")

# Payment endpoints
@api_router.post("/payments/create-intent")
async def create_payment_intent(booking_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        result = await db.table("bookings").select("*").eq("id", booking_id).eq("pet_owner_id", current_user["user_id"]).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = result.data[0]
        
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(booking["total_amount"] * 100),  # Amount in cents
            currency='sgd',  # Singapore dollars
            metadata={'booking_id': booking_id}
        )
        
        return {"client_secret": intent.client_secret}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment intent error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")

# File upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder=f"petbnb/{current_user.get('user_type')}/{current_user['user_id']}",
            resource_type="auto"
        )
        
        return {"url": result["secure_url"], "public_id": result["public_id"]}
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Upload error: {str(e)}")

# Review endpoints
@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review_data: dict, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        # Verify booking exists and user is part of it
        booking_result = await db.table("bookings").select("*").eq("id", review_data["booking_id"]).execute()
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        if booking["pet_owner_id"] != current_user["user_id"] and booking["caregiver_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to review this booking")
        
        if booking["booking_status"] != "completed":
            raise HTTPException(status_code=400, detail="Can only review completed bookings")
        
        review_dict = {
            "id": str(uuid.uuid4()),
            "booking_id": review_data["booking_id"],
            "reviewer_id": current_user["user_id"],
            "reviewee_id": review_data["reviewee_id"],
            "caregiver_id": review_data["caregiver_id"],
            "rating": review_data["rating"],
            "comment": review_data.get("comment"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = await db.table("reviews").insert(review_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create review")
        
        # Update caregiver rating
        await update_caregiver_rating(review_data["reviewee_id"], db)
        
        return ReviewResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create review error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create review")

async def update_caregiver_rating(caregiver_id: str, db):
    """Calculate and update caregiver rating"""
    try:
        # Calculate new rating
        reviews_result = await db.table("reviews").select("rating").eq("reviewee_id", caregiver_id).execute()
        reviews = reviews_result.data or []
        
        if reviews:
            avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
            await db.table("caregiver_profiles").update({
                "rating": round(avg_rating, 1),
                "total_reviews": len(reviews)
            }).eq("user_id", caregiver_id).execute()
    except Exception as e:
        logger.error(f"Update rating error: {e}")

# Message endpoints
@api_router.post("/messages", response_model=MessageResponse)
async def send_message(message_data: dict, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        # Verify booking exists and user is part of it
        if message_data.get("booking_id"):
            booking_result = await db.table("bookings").select("*").eq("id", message_data["booking_id"]).execute()
            if not booking_result.data:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            booking = booking_result.data[0]
            if booking["pet_owner_id"] != current_user["user_id"] and booking["caregiver_id"] != current_user["user_id"]:
                raise HTTPException(status_code=403, detail="Not authorized to message in this booking")
        
        message_dict = {
            "id": str(uuid.uuid4()),
            "booking_id": message_data.get("booking_id"),
            "sender_id": current_user["user_id"],
            "receiver_id": message_data["receiver_id"],
            "content": message_data["content"],
            "message_type": message_data.get("message_type", "text"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = await db.table("messages").insert(message_dict).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to send message")
        
        return MessageResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send message error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@api_router.get("/messages/{booking_id}", response_model=List[MessageResponse])
async def get_booking_messages(booking_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        # Verify user is part of booking
        booking_result = await db.table("bookings").select("*").eq("id", booking_id).execute()
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        if booking["pet_owner_id"] != current_user["user_id"] and booking["caregiver_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to view these messages")
        
        result = await db.table("messages").select("*").eq("booking_id", booking_id).order("created_at").execute()
        messages = result.data or []
        return [MessageResponse(**message) for message in messages]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get messages")

# Include router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "PetBnB API v2.0 - Supabase PostgreSQL Backend", "status": "running"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "supabase", "timestamp": datetime.utcnow().isoformat()}