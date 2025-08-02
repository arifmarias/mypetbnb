"""
Pydantic models for the PetBnB application with Supabase PostgreSQL
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserType(str, Enum):
    PET_OWNER = "pet_owner"
    CAREGIVER = "caregiver"
    ADMIN = "admin"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"

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

class ServiceType(str, Enum):
    PET_BOARDING = "pet_boarding"
    DOG_WALKING = "dog_walking"
    PET_GROOMING = "pet_grooming"
    DAYCARE = "daycare"
    PET_SITTING = "pet_sitting"
    VET_TRANSPORT = "vet_transport"
    CUSTOM = "custom"

# Base models
class BaseModelWithTimestamps(BaseModel):
    id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# User models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    profile_image_url: Optional[str] = None
    user_type: UserType
    is_active: bool = True
    email_verified: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    profile_image_url: Optional[str] = None
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class UserResponse(UserBase, BaseModelWithTimestamps):
    password_hash: Optional[str] = Field(None, exclude=True)
    
    class Config:
        from_attributes = True

# Pet models
class PetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=50)
    weight: Optional[float] = Field(None, gt=0, le=999.99)
    gender: Optional[Gender] = Gender.UNKNOWN
    description: Optional[str] = None
    special_needs: Optional[Dict[str, Any]] = None
    vaccination_records: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    medical_info: Optional[str] = None
    behavioral_notes: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: bool = True

class PetCreate(PetBase):
    owner_id: uuid.UUID

class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    species: Optional[str] = Field(None, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=50)
    weight: Optional[float] = Field(None, gt=0, le=999.99)
    gender: Optional[Gender] = None
    description: Optional[str] = None
    special_needs: Optional[Dict[str, Any]] = None
    vaccination_records: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    medical_info: Optional[str] = None
    behavioral_notes: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: Optional[bool] = None

class PetResponse(PetBase, BaseModelWithTimestamps):
    owner_id: uuid.UUID
    
    class Config:
        from_attributes = True

# Caregiver profile models
class CaregiverProfileBase(BaseModel):
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    hourly_rate: Optional[float] = Field(None, gt=0, le=999.99)
    availability_schedule: Optional[Dict[str, Any]] = None
    service_area: Optional[Dict[str, Any]] = None
    certifications: Optional[Dict[str, Any]] = None
    portfolio_images: Optional[List[str]] = None
    background_check_verified: bool = False
    is_available: bool = True
    insurance_info: Optional[str] = None

class CaregiverProfileCreate(CaregiverProfileBase):
    user_id: uuid.UUID

class CaregiverProfileUpdate(BaseModel):
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    hourly_rate: Optional[float] = Field(None, gt=0, le=999.99)
    availability_schedule: Optional[Dict[str, Any]] = None
    service_area: Optional[Dict[str, Any]] = None
    certifications: Optional[Dict[str, Any]] = None
    portfolio_images: Optional[List[str]] = None
    is_available: Optional[bool] = None
    insurance_info: Optional[str] = None

class CaregiverProfileResponse(CaregiverProfileBase, BaseModelWithTimestamps):
    user_id: uuid.UUID
    rating: float = 0.00
    total_reviews: int = 0
    
    class Config:
        from_attributes = True

# Caregiver service models
class CaregiverServiceBase(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=100)
    service_type: ServiceType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    base_price: float = Field(..., gt=0, le=99999.99)
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    max_pets: int = Field(default=1, ge=1, le=10)
    service_area_radius: float = Field(default=10.0, gt=0, le=100)
    is_active: bool = True

class CaregiverServiceCreate(CaregiverServiceBase):
    caregiver_id: uuid.UUID

class CaregiverServiceUpdate(BaseModel):
    service_name: Optional[str] = Field(None, max_length=100)
    service_type: Optional[ServiceType] = None
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0, le=99999.99)
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    max_pets: Optional[int] = Field(None, ge=1, le=10)
    service_area_radius: Optional[float] = Field(None, gt=0, le=100)
    is_active: Optional[bool] = None

class CaregiverServiceResponse(CaregiverServiceBase, BaseModelWithTimestamps):
    caregiver_id: uuid.UUID
    
    class Config:
        from_attributes = True

# Booking models
class BookingBase(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    total_amount: float = Field(..., gt=0, le=999999.99)
    special_requirements: Optional[str] = None
    
    @validator('end_datetime')
    def validate_end_datetime(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('End datetime must be after start datetime')
        return v

class BookingCreate(BookingBase):
    pet_owner_id: uuid.UUID
    caregiver_id: uuid.UUID
    pet_id: uuid.UUID
    service_id: uuid.UUID

class BookingUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    booking_status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    special_requirements: Optional[str] = None

class BookingResponse(BookingBase, BaseModelWithTimestamps):
    pet_owner_id: uuid.UUID
    caregiver_id: uuid.UUID
    pet_id: uuid.UUID
    service_id: uuid.UUID
    booking_status: BookingStatus = BookingStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    
    class Config:
        from_attributes = True

# Review models
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    is_visible: bool = True

class ReviewCreate(ReviewBase):
    booking_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    caregiver_id: uuid.UUID

class ReviewUpdate(BaseModel):
    comment: Optional[str] = None
    response: Optional[str] = None
    is_visible: Optional[bool] = None

class ReviewResponse(ReviewBase, BaseModelWithTimestamps):
    booking_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    caregiver_id: uuid.UUID
    response: Optional[str] = None
    
    class Config:
        from_attributes = True

# Message models
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1)
    message_type: str = Field(default="text", pattern="^(text|image|document)$")
    attachment_url: Optional[str] = None

class MessageCreate(MessageBase):
    booking_id: Optional[uuid.UUID] = None
    sender_id: uuid.UUID
    receiver_id: uuid.UUID

class MessageUpdate(BaseModel):
    is_read: bool = True

class MessageResponse(MessageBase, BaseModelWithTimestamps):
    booking_id: Optional[uuid.UUID] = None
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    is_read: bool = False
    
    class Config:
        from_attributes = True

# Authentication models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Location search models
class LocationSearch(BaseModel):
    latitude: float
    longitude: float
    radius: float = 10.0  # kilometers
    service_type: Optional[ServiceType] = None
    min_rating: Optional[float] = None
    max_price: Optional[float] = None

# Pagination models
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

# Payment transaction models
class PaymentTransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field(default="sgd", max_length=3)
    metadata: Optional[Dict[str, Any]] = None

class PaymentTransactionCreate(PaymentTransactionBase):
    booking_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    session_id: str

class PaymentTransactionUpdate(BaseModel):
    payment_id: Optional[str] = None
    payment_status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PaymentTransactionResponse(PaymentTransactionBase, BaseModelWithTimestamps):
    booking_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    session_id: str
    payment_id: Optional[str] = None
    payment_status: str = "pending"
    
    class Config:
        from_attributes = True