from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import asyncio
import httpx
from enum import Enum
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

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
app = FastAPI(title="PetBnB API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class UserRole(str, Enum):
    PET_OWNER = "pet_owner"
    CAREGIVER = "caregiver"
    ADMIN = "admin"

class ServiceType(str, Enum):
    PET_BOARDING = "pet_boarding"
    DOG_WALKING = "dog_walking"
    PET_GROOMING = "pet_grooming"
    DAYCARE = "daycare"
    PET_SITTING = "pet_sitting"
    VET_TRANSPORT = "vet_transport"
    CUSTOM = "custom"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    profile_image_url: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str

class PetBase(BaseModel):
    name: str
    breed: str
    age: int
    weight: float
    gender: str
    description: Optional[str] = None
    medical_info: Optional[str] = None
    behavioral_notes: Optional[str] = None
    photo_urls: List[str] = []
    vaccination_records: List[str] = []
    emergency_contact: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Pet(PetBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str

class PetCreate(PetBase):
    pass

class CaregiverServiceBase(BaseModel):
    service_type: ServiceType
    title: str
    description: str
    base_price: float
    duration_minutes: Optional[int] = None
    max_pets: int = 1
    service_area_radius: float = 10.0  # in kilometers
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CaregiverService(CaregiverServiceBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    caregiver_id: str

class CaregiverServiceCreate(CaregiverServiceBase):
    pass

class CaregiverProfile(BaseModel):
    user_id: str
    bio: str
    experience_years: int
    certifications: List[str] = []
    portfolio_images: List[str] = []
    availability: Dict[str, List[str]] = {}  # day_of_week: [time_slots]
    rating: float = 0.0
    total_reviews: int = 0
    is_background_verified: bool = False
    insurance_info: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingBase(BaseModel):
    pet_ids: List[str]
    service_id: str
    start_datetime: datetime
    end_datetime: datetime
    total_amount: float
    special_requirements: Optional[str] = None
    status: BookingStatus = BookingStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BookingBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pet_owner_id: str
    caregiver_id: str

class BookingCreate(BookingBase):
    pass

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    response: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"  # text, image, document
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LocationSearch(BaseModel):
    latitude: float
    longitude: float
    radius: float = 10.0  # kilometers
    service_type: Optional[ServiceType] = None
    min_rating: Optional[float] = None
    max_price: Optional[float] = None

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

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
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashed_password'] = hashed_password
    user_dict['id'] = str(uuid.uuid4())
    user_dict['created_at'] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    
    # Create caregiver profile if role is caregiver
    if user_data.role == UserRole.CAREGIVER:
        caregiver_profile = {
            "user_id": user_dict['id'],
            "bio": "",
            "experience_years": 0,
            "certifications": [],
            "portfolio_images": [],
            "availability": {},
            "rating": 0.0,
            "total_reviews": 0,
            "is_background_verified": False,
            "insurance_info": None,
            "created_at": datetime.utcnow()
        }
        await db.caregiver_profiles.insert_one(caregiver_profile)
    
    # Send welcome email
    background_tasks.add_task(
        send_email,
        user_data.email,
        "Welcome to PetBnB!",
        f"<h1>Welcome {user_data.full_name}!</h1><p>Thanks for joining PetBnB. We're excited to have you on board!</p>"
    )
    
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_dict['id']}

@api_router.post("/auth/login", response_model=dict)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user_credentials.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["id"]}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Pet management endpoints
@api_router.post("/pets", response_model=Pet)
async def create_pet(pet_data: PetCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PET_OWNER:
        raise HTTPException(status_code=403, detail="Only pet owners can create pets")
    
    pet_dict = pet_data.dict()
    pet_dict['id'] = str(uuid.uuid4())
    pet_dict['owner_id'] = current_user.id
    pet_dict['created_at'] = datetime.utcnow()
    
    await db.pets.insert_one(pet_dict)
    return Pet(**pet_dict)

@api_router.get("/pets", response_model=List[Pet])
async def get_user_pets(current_user: User = Depends(get_current_user)):
    pets = await db.pets.find({"owner_id": current_user.id}).to_list(100)
    return [Pet(**pet) for pet in pets]

@api_router.get("/pets/{pet_id}", response_model=Pet)
async def get_pet(pet_id: str, current_user: User = Depends(get_current_user)):
    pet = await db.pets.find_one({"id": pet_id, "owner_id": current_user.id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return Pet(**pet)

# Caregiver service endpoints
@api_router.post("/caregiver/services", response_model=CaregiverService)
async def create_service(service_data: CaregiverServiceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can create services")
    
    service_dict = service_data.dict()
    service_dict['id'] = str(uuid.uuid4())
    service_dict['caregiver_id'] = current_user.id
    service_dict['created_at'] = datetime.utcnow()
    
    await db.caregiver_services.insert_one(service_dict)
    return CaregiverService(**service_dict)

@api_router.get("/caregiver/services", response_model=List[CaregiverService])
async def get_caregiver_services(current_user: User = Depends(get_current_user)):
    services = await db.caregiver_services.find({"caregiver_id": current_user.id}).to_list(100)
    return [CaregiverService(**service) for service in services]

@api_router.post("/search/location", response_model=List[dict])
async def search_caregivers_by_location(search_params: LocationSearch):
    # Find caregivers within radius
    caregivers = []
    
    # Get all caregiver services
    services = await db.caregiver_services.find({"is_active": True}).to_list(1000)
    
    for service in services:
        # Get caregiver user info
        caregiver = await db.users.find_one({"id": service["caregiver_id"]})
        if not caregiver or not caregiver.get("latitude") or not caregiver.get("longitude"):
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
            
            # Get caregiver profile
            profile = await db.caregiver_profiles.find_one({"user_id": caregiver["id"]})
            if search_params.min_rating and profile and profile.get("rating", 0) < search_params.min_rating:
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

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PET_OWNER:
        raise HTTPException(status_code=403, detail="Only pet owners can create bookings")
    
    # Get service details
    service = await db.caregiver_services.find_one({"id": booking_data.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    booking_dict = booking_data.dict()
    booking_dict['id'] = str(uuid.uuid4())
    booking_dict['pet_owner_id'] = current_user.id
    booking_dict['caregiver_id'] = service['caregiver_id']
    booking_dict['created_at'] = datetime.utcnow()
    
    await db.bookings.insert_one(booking_dict)
    return Booking(**booking_dict)

@api_router.get("/bookings", response_model=List[Booking])
async def get_user_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.PET_OWNER:
        bookings = await db.bookings.find({"pet_owner_id": current_user.id}).to_list(100)
    elif current_user.role == UserRole.CAREGIVER:
        bookings = await db.bookings.find({"caregiver_id": current_user.id}).to_list(100)
    else:
        bookings = []
    
    return [Booking(**booking) for booking in bookings]

# Payment endpoints
@api_router.post("/payments/create-intent")
async def create_payment_intent(booking_id: str, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "pet_owner_id": current_user.id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    try:
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(booking["total_amount"] * 100),  # Amount in cents
            currency='sgd',  # Singapore dollars
            metadata={'booking_id': booking_id}
        )
        
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")

# File upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder=f"petbnb/{current_user.role}/{current_user.id}",
            resource_type="auto"
        )
        
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload error: {str(e)}")

# Review endpoints
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: dict, current_user: User = Depends(get_current_user)):
    # Verify booking exists and user is part of it
    booking = await db.bookings.find_one({
        "id": review_data["booking_id"],
        "$or": [
            {"pet_owner_id": current_user.id},
            {"caregiver_id": current_user.id}
        ]
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    review_dict = {
        "id": str(uuid.uuid4()),
        "booking_id": review_data["booking_id"],
        "reviewer_id": current_user.id,
        "reviewee_id": review_data["reviewee_id"],
        "rating": review_data["rating"],
        "comment": review_data.get("comment"),
        "created_at": datetime.utcnow()
    }
    
    await db.reviews.insert_one(review_dict)
    
    # Update caregiver rating
    if review_data["reviewee_id"] != current_user.id:
        await update_caregiver_rating(review_data["reviewee_id"])
    
    return Review(**review_dict)

async def update_caregiver_rating(caregiver_id: str):
    # Calculate new rating
    reviews = await db.reviews.find({"reviewee_id": caregiver_id}).to_list(1000)
    if reviews:
        avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
        await db.caregiver_profiles.update_one(
            {"user_id": caregiver_id},
            {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(reviews)}}
        )

# Message endpoints
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: dict, current_user: User = Depends(get_current_user)):
    # Verify booking exists and user is part of it
    booking = await db.bookings.find_one({
        "id": message_data["booking_id"],
        "$or": [
            {"pet_owner_id": current_user.id},
            {"caregiver_id": current_user.id}
        ]
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    message_dict = {
        "id": str(uuid.uuid4()),
        "booking_id": message_data["booking_id"],
        "sender_id": current_user.id,
        "receiver_id": message_data["receiver_id"],
        "content": message_data["content"],
        "message_type": message_data.get("message_type", "text"),
        "created_at": datetime.utcnow()
    }
    
    await db.messages.insert_one(message_dict)
    return Message(**message_dict)

@api_router.get("/messages/{booking_id}", response_model=List[Message])
async def get_booking_messages(booking_id: str, current_user: User = Depends(get_current_user)):
    # Verify user is part of booking
    booking = await db.bookings.find_one({
        "id": booking_id,
        "$or": [
            {"pet_owner_id": current_user.id},
            {"caregiver_id": current_user.id}
        ]
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    messages = await db.messages.find({"booking_id": booking_id}).sort("created_at", 1).to_list(1000)
    return [Message(**message) for message in messages]

# Include router
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()