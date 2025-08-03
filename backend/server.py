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
from fastapi.responses import HTMLResponse

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
from verification import verification_service, oauth_service

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

# Utility functions (using AuthService for consistency)
def create_access_token(data: dict):
    return AuthService.create_access_token(data)

def verify_password(plain_password, hashed_password):
    return AuthService.verify_password(plain_password, hashed_password)

def get_password_hash(password):
    return AuthService.get_password_hash(password)

def calculate_distance(lat1, lon1, lat2, lon2):
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

async def send_email(to_email: str, subject: str, body: str):
    """Generic email sending function"""
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

async def send_verification_email(user_id: str, email: str, first_name: str, db):
    """Helper function to send verification email during registration"""
    try:
        # Create verification token
        verification_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        verification_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "email": email,
            "verification_token": verification_token,
            "verification_type": "email",
            "expires_at": expires_at.isoformat(),
            "is_used": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.table("verification_tokens").insert(verification_data).execute()
        
        # Send verification email with beautiful template
        verification_url = f"{os.getenv('FRONTEND_URL')}/verify-email?token={verification_token}"
        
        await send_email(
            email,
            "Verify Your PetBnB Account 📧",
            f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                    .header {{ background-color: #FF5A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; }}
                    .button {{ 
                        display: inline-block; 
                        padding: 15px 30px; 
                        background-color: #FF5A5F; 
                        color: #ffffff !important; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        margin: 20px 0;
                        font-weight: bold;
                        font-size: 16px;
                        border: 2px solid #FF5A5F;
                        text-align: center;
                        min-width: 200px;
                        box-shadow: 0 4px 8px rgba(255, 90, 95, 0.3);
                    }}
                    .button:hover {{
                        background-color: #e84a54;
                        border-color: #e84a54;
                    }}
                    .link-text {{
                        word-break: break-all;
                        background-color: #f5f5f5;
                        padding: 10px;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 12px;
                    }}
                    .footer {{ 
                        padding: 20px; 
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        background-color: #f9f9f9;
                        border-radius: 0 0 8px 8px;
                    }}
                    .highlight {{
                        background-color: #fff3cd;
                        padding: 15px;
                        border-radius: 6px;
                        border-left: 4px solid #ffc107;
                        margin: 20px 0;
                    }}
                    .verification-box {{
                        background: linear-gradient(135deg, #FF5A5F 0%, #FF8A80 100%);
                        color: white;
                        padding: 25px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body style="background-color: #f4f4f4; padding: 20px;">
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">📧 Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <div class="verification-box">
                            <h2 style="margin: 10px 0; color: white;">Hi {first_name}!</h2>
                            <p style="margin: 0; font-size: 16px; color: white;">Just one more step to complete your PetBnB account!</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #333;">
                            Thank you for joining PetBnB! Please verify your email address to complete your account setup and unlock all features.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{verification_url}" class="button">✉️ VERIFY EMAIL ADDRESS</a>
                        </div>
                        
                        <div class="highlight">
                            <p style="margin: 0; color: #856404;"><strong>🔓 After verification, you can:</strong></p>
                            <ul style="margin: 10px 0 0 0; color: #856404;">
                                <li>Create and manage pet profiles</li>
                                <li>Book pet care services</li>
                                <li>Message with caregivers</li>
                                <li>Access all PetBnB features</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                        <div class="link-text">
                            <a href="{verification_url}" style="color: #FF5A5F; text-decoration: none;">{verification_url}</a>
                        </div>
                        
                        <p style="color: #888; font-size: 14px; margin-top: 30px;">
                            ⏰ This verification link will expire in 24 hours.
                        </p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">If you didn't create an account with PetBnB, please ignore this email.</p>
                        <p style="margin: 5px 0 0 0;">© 2024 PetBnB - Your Pet's Home Away From Home</p>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        # Don't fail registration if email sending fails

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
        
        # Send verification email for new users
        background_tasks.add_task(
            send_verification_email,
            created_user['id'],
            user_data.email,
            user_data.first_name,
            db
        )
        
        # Send welcome email
        background_tasks.add_task(
            send_email,
            user_data.email,
            "Welcome to PetBnB! 🐾",
            f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                    .header {{ background-color: #FF5A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; }}
                    .welcome-box {{
                        background: linear-gradient(135deg, #FF5A5F 0%, #FF8A80 100%);
                        color: white;
                        padding: 25px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 20px 0;
                    }}
                    .feature-box {{
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 15px 0;
                        border-left: 4px solid #FF5A5F;
                    }}
                    .button {{ 
                        display: inline-block; 
                        padding: 15px 30px; 
                        background-color: #FF5A5F; 
                        color: #ffffff !important; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        margin: 20px 0;
                        font-weight: bold;
                        font-size: 16px;
                        border: 2px solid #FF5A5F;
                        text-align: center;
                        min-width: 200px;
                        box-shadow: 0 4px 8px rgba(255, 90, 95, 0.3);
                    }}
                    .footer {{ 
                        padding: 20px; 
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        background-color: #f9f9f9;
                        border-radius: 0 0 8px 8px;
                    }}
                    .emoji {{ font-size: 24px; }}
                </style>
            </head>
            <body style="background-color: #f4f4f4; padding: 20px;">
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🐾 Welcome to PetBnB!</h1>
                    </div>
                    <div class="content">
                        <div class="welcome-box">
                            <div class="emoji">🎉</div>
                            <h2 style="margin: 10px 0; color: white;">Hi {user_data.first_name}!</h2>
                            <p style="margin: 0; font-size: 18px; color: white;">Welcome to the PetBnB family!</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Thank you for joining PetBnB - the trusted platform connecting pet owners with loving caregivers across Malaysia and Singapore!
                        </p>
                        
                        <div class="feature-box">
                            <h3 style="margin: 0 0 10px 0; color: #FF5A5F;">🔐 Next Step: Verify Your Email</h3>
                            <p style="margin: 0; color: #666;">We've sent you a verification email. Please check your inbox and click the verification link to complete your account setup.</p>
                        </div>
                        
                        <h3 style="color: #333; margin-top: 30px;">What you can do with PetBnB:</h3>
                        
                        {"<div class='feature-box'><h4 style='margin: 0 0 10px 0; color: #FF5A5F;'>🏠 For Pet Owners:</h4><p style='margin: 0; color: #666;'>Find trusted caregivers for boarding, walking, grooming, and sitting services.</p></div>" if user_data.user_type == "pet_owner" else "<div class='feature-box'><h4 style='margin: 0 0 10px 0; color: #FF5A5F;'>💼 For Caregivers:</h4><p style='margin: 0; color: #666;'>Offer your pet care services and earn money doing what you love!</p></div>"}
                        
                        <div class="feature-box">
                            <h4 style="margin: 0 0 10px 0; color: #FF5A5F;">✅ Verified & Safe</h4>
                            <p style="margin: 0; color: #666;">All caregivers go through background checks and identity verification.</p>
                        </div>
                        
                        <div class="feature-box">
                            <h4 style="margin: 0 0 10px 0; color: #FF5A5F;">💬 Real-time Messaging</h4>
                            <p style="margin: 0; color: #666;">Stay connected with caregivers through our built-in messaging system.</p>
                        </div>
                        
                        <div class="feature-box">
                            <h4 style="margin: 0 0 10px 0; color: #FF5A5F;">💳 Secure Payments</h4>
                            <p style="margin: 0; color: #666;">Safe and convenient payments with local Malaysian and Singaporean payment methods.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px;">
                            <p style="margin: 0; color: #856404; font-weight: bold;">
                                📧 Don't forget to verify your email to unlock all features!
                            </p>
                        </div>
                        
                        <p style="color: #666; text-align: center; margin-top: 30px;">
                            Welcome aboard! We're excited to help you provide the best care for pets. 🐕🐱
                        </p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">Need help? Contact us at support@petbnb.com</p>
                        <p style="margin: 5px 0 0 0;">© 2024 PetBnB - Your Pet's Home Away From Home</p>
                        <p style="margin: 10px 0 0 0;">
                            <a href="#" style="color: #FF5A5F; text-decoration: none;">Privacy Policy</a> | 
                            <a href="#" style="color: #FF5A5F; text-decoration: none;">Terms of Service</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        
        access_token = create_access_token(data={
            "sub": user_data.email, 
            "user_id": created_user['id'], 
            "user_type": user_data.user_type,
            "email": user_data.email
        })
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
        
        access_token = create_access_token(data={
            "sub": user_credentials.email, 
            "user_id": user["id"], 
            "user_type": user["user_type"],
            "email": user_credentials.email
        })
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

# Add to backend/server.py - Insert these endpoints after the existing auth endpoints

@api_router.post("/auth/verify-email", response_model=dict)
async def verify_email(verification_data: dict, db=Depends(get_db_client)):
    """Verify email address using verification token"""
    try:
        verification_token = verification_data.get("token")
        if not verification_token:
            raise HTTPException(status_code=400, detail="Verification token required")
        
        # Get verification token from database
        token_result = await db.table("verification_tokens").select("*").eq("verification_token", verification_token).eq("is_used", False).execute()
        
        if not token_result.data:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
        token_data = token_result.data[0]
        
        # Check if token expired
        from datetime import datetime
        expires_at = datetime.fromisoformat(token_data["expires_at"].replace('Z', '+00:00'))
        if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
            raise HTTPException(status_code=400, detail="Verification token has expired")
        
        # Mark token as used
        await db.table("verification_tokens").update({
            "is_used": True,
            "verified_at": datetime.utcnow().isoformat()
        }).eq("verification_token", verification_token).execute()
        
        # Update user email_verified status
        await db.table("users").update({
            "email_verified": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", token_data["user_id"]).execute()
        
        return {"message": "Email verified successfully", "verified": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")

@api_router.post("/auth/resend-verification", response_model=dict)
async def resend_verification_email(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Resend email verification"""
    try:
        # Get user info
        user_result = await db.table("users").select("*").eq("id", current_user["user_id"]).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        
        if user.get("email_verified"):
            return {"message": "Email already verified", "already_verified": True}
        
        # Create new verification token
        verification_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        verification_data = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "email": user["email"],
            "verification_token": verification_token,
            "verification_type": "email",
            "expires_at": expires_at.isoformat(),
            "is_used": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.table("verification_tokens").insert(verification_data).execute()
        
        # Send verification email
        verification_url = f"{os.getenv('FRONTEND_URL')}/verify-email?token={verification_token}"
        
        await send_email(
            user["email"],
            "Verify Your PetBnB Account",
            f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                    .header {{ background-color: #FF5A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; }}
                    .button {{ 
                        display: inline-block; 
                        padding: 15px 30px; 
                        background-color: #FF5A5F; 
                        color: #ffffff !important; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        margin: 20px 0;
                        font-weight: bold;
                        font-size: 16px;
                        border: 2px solid #FF5A5F;
                        text-align: center;
                        min-width: 200px;
                        box-shadow: 0 4px 8px rgba(255, 90, 95, 0.3);
                    }}
                    .button:hover {{
                        background-color: #e84a54;
                        border-color: #e84a54;
                    }}
                    .link-text {{
                        word-break: break-all;
                        background-color: #f5f5f5;
                        padding: 10px;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 12px;
                    }}
                    .footer {{ 
                        padding: 20px; 
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        background-color: #f9f9f9;
                        border-radius: 0 0 8px 8px;
                    }}
                    .highlight {{
                        background-color: #fff3cd;
                        padding: 15px;
                        border-radius: 6px;
                        border-left: 4px solid #ffc107;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body style="background-color: #f4f4f4; padding: 20px;">
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🐾 Welcome to PetBnB!</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #333;">Hi {user['first_name']}!</h2>
                        <p>Thank you for joining PetBnB! Please verify your email address to complete your account setup.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{verification_url}" class="button">✉️ VERIFY EMAIL ADDRESS</a>
                        </div>
                        
                        <div class="highlight">
                            <p style="margin: 0; color: #856404;"><strong>Important:</strong> You need to verify your email before you can:</p>
                            <ul style="margin: 10px 0 0 0; color: #856404;">
                                <li>Create bookings (for pet owners)</li>
                                <li>Create services (for caregivers)</li>
                                <li>Access full platform features</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
                        <div class="link-text">
                            <a href="{verification_url}" style="color: #FF5A5F; text-decoration: none;">{verification_url}</a>
                        </div>
                        
                        <p style="color: #888; font-size: 14px; margin-top: 30px;">
                            ⏰ This verification link will expire in 24 hours.
                        </p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">If you didn't create an account with PetBnB, please ignore this email.</p>
                        <p style="margin: 5px 0 0 0;">© 2024 PetBnB - Your Pet's Home Away From Home</p>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        
        return {"message": "Verification email sent", "sent": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend verification email")

@api_router.get("/auth/verification-status", response_model=dict)
async def get_verification_status(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Get user's verification status"""
    try:
        # Get user info
        user_result = await db.table("users").select("*").eq("id", current_user["user_id"]).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        
        verification_status = {
            "email_verified": user.get("email_verified", False),
            "id_verification_status": None,
            "id_verification_required": user.get("user_type") == "caregiver",
            "can_create_bookings": False,
            "can_create_services": False
        }
        
        # Check ID verification for caregivers
        if user.get("user_type") == "caregiver":
            profile_result = await db.table("caregiver_profiles").select("*").eq("user_id", current_user["user_id"]).execute()
            if profile_result.data:
                profile = profile_result.data[0]
                verification_status["id_verification_status"] = profile.get("id_verification_status", "not_submitted")
        
        # Determine permissions
        if user.get("user_type") == "pet_owner":
            verification_status["can_create_bookings"] = user.get("email_verified", False)
        elif user.get("user_type") == "caregiver":
            verification_status["can_create_services"] = (
                user.get("email_verified", False) and
                verification_status["id_verification_status"] == "approved"
            )
        
        return {"verification_status": verification_status}
        
    except Exception as e:
        logger.error(f"Get verification status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get verification status")
    


# OAuth and Verification endpoints
@api_router.post("/auth/oauth/emergent", response_model=dict)
async def oauth_emergent_login(session_data: dict, db=Depends(get_db_client)):
    """Handle Emergent OAuth login"""
    try:
        session_id = session_data.get("session_id")
        user_type = session_data.get("user_type", "pet_owner")  # Default to pet_owner
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Verify session with Emergent Auth
        oauth_data = await oauth_service.verify_emergent_session(session_id)
        if not oauth_data:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Create or get user
        user = await oauth_service.create_or_update_oauth_user(db, oauth_data, user_type)
        
        # Create session token (7 days expiry)
        session_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Store session
        session_data = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_token": session_token,
            "provider": "emergent",
            "expires_at": expires_at.isoformat(),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.table("oauth_sessions").insert(session_data).execute()
        
        # If new user (email not verified), send verification email
        if not user.get("email_verified"):
            verification_token = await verification_service.create_email_verification_token(
                db, user["id"], user["email"]
            )
            await verification_service.send_verification_email(
                user["email"], verification_token, user["first_name"]
            )
        
        # Create JWT token for API access
        access_token = create_access_token(data={
            "sub": user["email"], 
            "user_id": user["id"], 
            "user_type": user["user_type"],
            "email": user["email"]
        })
        
        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "user_id": user["id"],
            "email_verified": user.get("email_verified", False),
            "expires_in": 7 * 24 * 60 * 60  # 7 days in seconds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth login error: {e}")
        raise HTTPException(status_code=500, detail="OAuth login failed")
@app.get("/verify-email", response_class=HTMLResponse)
async def verify_email_web(token: str, db=Depends(get_db_client)):
    """Web-based email verification endpoint"""
    try:
        # Get verification token from database
        token_result = await db.table("verification_tokens").select("*").eq("verification_token", token).eq("is_used", False).execute()
        
        if not token_result.data:
            return HTMLResponse("""
            <html>
                <head><title>Email Verification - PetBnB</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #FF5A5F;">❌ Verification Failed</h1>
                    <p>This verification link is invalid or has already been used.</p>
                    <p>Please request a new verification email from the app.</p>
                </body>
            </html>
            """, status_code=400)
        
        token_data = token_result.data[0]
        
        # Check if token expired
        expires_at = datetime.fromisoformat(token_data["expires_at"].replace('Z', '+00:00'))
        if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
            return HTMLResponse("""
            <html>
                <head><title>Email Verification - PetBnB</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #FF5A5F;">❌ Link Expired</h1>
                    <p>This verification link has expired.</p>
                    <p>Please request a new verification email from the app.</p>
                </body>
            </html>
            """, status_code=400)
        
        # Mark token as used
        await db.table("verification_tokens").update({
            "is_used": True,
            "verified_at": datetime.utcnow().isoformat()
        }).eq("verification_token", token).execute()
        
        # Update user email_verified status
        user_result = await db.table("users").update({
            "email_verified": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", token_data["user_id"]).execute()
        
        # Get user info for personalized message
        user_info = await db.table("users").select("first_name, email").eq("id", token_data["user_id"]).execute()
        user_name = user_info.data[0]["first_name"] if user_info.data else "User"
        
        return HTMLResponse(f"""
        <html>
            <head>
                <title>Email Verification - PetBnB</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background-color: #f9f9f9;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #FF5A5F;">✅ Email Verified!</h1>
                    <p style="font-size: 18px; color: #333;">Hi {user_name}!</p>
                    <p style="color: #666;">Your email has been successfully verified.</p>
                    <p style="color: #666;">You can now return to the PetBnB app and enjoy all features!</p>
                    <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">
                        <p style="color: #333; margin: 0;">Return to the app and tap<br><strong>"I've Verified My Email"</strong></p>
                    </div>
                </div>
            </body>
        </html>
        """)
        
    except Exception as e:
        logger.error(f"Web email verification error: {e}")
        return HTMLResponse("""
        <html>
            <head><title>Email Verification - PetBnB</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: #FF5A5F;">❌ Verification Error</h1>
                <p>An error occurred during verification.</p>
                <p>Please try again or contact support.</p>
            </body>
        </html>
        """, status_code=500)
        
@api_router.post("/auth/verify-email", response_model=dict)
async def verify_email(verification_data: dict, db=Depends(get_db_client)):
    """Verify email address using verification token"""
    try:
        verification_token = verification_data.get("token")
        if not verification_token:
            raise HTTPException(status_code=400, detail="Verification token required")
        
        # Verify token
        success = await verification_service.verify_email_token(db, verification_token)
        
        if success:
            return {"message": "Email verified successfully", "verified": True}
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")

@api_router.post("/auth/resend-verification", response_model=dict)
async def resend_verification_email(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Resend email verification"""
    try:
        # Get user info
        user_result = await db.table("users").select("*").eq("id", current_user["user_id"]).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_result.data[0]
        
        if user.get("email_verified"):
            return {"message": "Email already verified", "already_verified": True}
        
        # Create new verification token
        verification_token = await verification_service.create_email_verification_token(
            db, user["id"], user["email"]
        )
        
        # Send verification email
        await verification_service.send_verification_email(
            user["email"], verification_token, user["first_name"]
        )
        
        return {"message": "Verification email sent", "sent": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend verification email")

@api_router.get("/auth/verification-status", response_model=dict)
async def get_verification_status(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Get user's verification status"""
    try:
        status = await verification_service.check_user_verification_status(db, current_user["user_id"])
        return {"verification_status": status}
        
    except Exception as e:
        logger.error(f"Get verification status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get verification status")

@api_router.post("/caregiver/submit-id-verification", response_model=dict)
async def submit_id_verification(
    verification_data: dict, 
    current_user: dict = Depends(get_current_user), 
    db=Depends(get_db_client)
):
    """Submit ID verification for caregivers"""
    try:
        if current_user.get("user_type") != "caregiver":
            raise HTTPException(status_code=403, detail="Only caregivers can submit ID verification")
        
        # Check if email is verified first
        user_result = await db.table("users").select("email_verified").eq("id", current_user["user_id"]).execute()
        if not user_result.data or not user_result.data[0].get("email_verified"):
            raise HTTPException(status_code=400, detail="Email must be verified before ID verification")
        
        document_type = verification_data.get("document_type")  # "nric" or "passport"
        id_document_url = verification_data.get("id_document_url")
        selfie_url = verification_data.get("selfie_url")
        
        if not all([document_type, id_document_url, selfie_url]):
            raise HTTPException(status_code=400, detail="Document type, ID document, and selfie are required")
        
        if document_type not in ["nric", "passport"]:
            raise HTTPException(status_code=400, detail="Document type must be 'nric' or 'passport'")
        
        # Create verification request
        verification_id = await verification_service.create_id_verification_request(
            db, current_user["user_id"], id_document_url, selfie_url, document_type
        )
        
        return {
            "message": "ID verification submitted successfully",
            "verification_id": verification_id,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ID verification submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit ID verification")

@api_router.get("/caregiver/id-verification-status", response_model=dict)
async def get_id_verification_status(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Get caregiver's ID verification status"""
    try:
        if current_user.get("user_type") != "caregiver":
            raise HTTPException(status_code=403, detail="Only caregivers can check ID verification status")
        
        # Get verification status
        verification_result = await db.table("id_verifications").select("*").eq("user_id", current_user["user_id"]).order("created_at", desc=True).limit(1).execute()
        
        if verification_result.data:
            verification = verification_result.data[0]
            return {
                "status": verification["verification_status"],
                "document_type": verification["document_type"],
                "submitted_at": verification["submitted_at"],
                "verified_at": verification.get("verified_at"),
                "admin_notes": verification.get("admin_notes")
            }
        else:
            return {
                "status": "not_submitted",
                "document_type": None,
                "submitted_at": None,
                "verified_at": None,
                "admin_notes": None
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get ID verification status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get ID verification status")
@api_router.post("/pets", response_model=PetResponse)
async def create_pet(pet_data: PetCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    try:
        if current_user.get("user_type") != "pet_owner":
            raise HTTPException(status_code=403, detail="Only pet owners can create pets")
        
        # Check email verification
        user_result = await db.table("users").select("email_verified").eq("id", current_user["user_id"]).execute()
        if not user_result.data or not user_result.data[0].get("email_verified"):
            raise HTTPException(status_code=403, detail="Email verification required to create pets")
        
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
        
        # Check verification status
        verification_status = await verification_service.check_user_verification_status(db, current_user["user_id"])
        
        if not verification_status.get("email_verified"):
            raise HTTPException(status_code=403, detail="Email verification required to create services")
        
        if verification_status.get("id_verification_status") != "approved":
            raise HTTPException(status_code=403, detail="ID verification approval required to create services")
        
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
        
        # Check email verification
        user_result = await db.table("users").select("email_verified").eq("id", current_user["user_id"]).execute()
        if not user_result.data or not user_result.data[0].get("email_verified"):
            raise HTTPException(status_code=403, detail="Email verification required to create bookings")
        
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

# Add these enhanced booking endpoints to your backend/server.py

@api_router.put("/bookings/{booking_id}/status", response_model=dict)
async def update_booking_status(
    booking_id: str, 
    status_data: dict, 
    current_user: dict = Depends(get_current_user), 
    db=Depends(get_db_client)
):
    """Update booking status (caregiver can confirm/reject, both can cancel)"""
    try:
        new_status = status_data.get("status")
        if not new_status or new_status not in ["confirmed", "rejected", "cancelled", "in_progress", "completed"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Get booking details
        booking_result = await db.table("bookings").select("*, caregiver_profiles!inner(user_id)").eq("id", booking_id).execute()
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check if user has permission to update this booking
        is_pet_owner = booking["pet_owner_id"] == current_user["user_id"]
        is_caregiver = booking["caregiver_profiles"]["user_id"] == current_user["user_id"]
        
        if not (is_pet_owner or is_caregiver):
            raise HTTPException(status_code=403, detail="Not authorized to update this booking")
        
        # Business rules for status changes
        current_status = booking["booking_status"]
        
        # Only caregiver can confirm/reject pending bookings
        if new_status in ["confirmed", "rejected"] and not is_caregiver:
            raise HTTPException(status_code=403, detail="Only caregiver can confirm or reject bookings")
        
        # Only caregiver can mark as in_progress or completed
        if new_status in ["in_progress", "completed"] and not is_caregiver:
            raise HTTPException(status_code=403, detail="Only caregiver can update service progress")
        
        # Both can cancel (with different rules)
        if new_status == "cancelled":
            if current_status in ["completed"]:
                raise HTTPException(status_code=400, detail="Cannot cancel completed bookings")
        
        # Update booking status
        update_data = {
            "booking_status": new_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.table("bookings").update(update_data).eq("id", booking_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update booking")
        
        # Send notification emails based on status change
        booking_data = result.data[0]
        
        # Get user details for notifications
        pet_owner_result = await db.table("users").select("*").eq("id", booking["pet_owner_id"]).execute()
        caregiver_result = await db.table("users").select("*").eq("id", booking["caregiver_profiles"]["user_id"]).execute()
        service_result = await db.table("caregiver_services").select("*").eq("id", booking["service_id"]).execute()
        
        if pet_owner_result.data and caregiver_result.data and service_result.data:
            pet_owner = pet_owner_result.data[0]
            caregiver = caregiver_result.data[0]
            service = service_result.data[0]
            
            # Send appropriate notification emails
            if new_status == "confirmed":
                await send_booking_confirmation_email(pet_owner, caregiver, service, booking_data)
            elif new_status == "rejected":
                await send_booking_rejection_email(pet_owner, caregiver, service, booking_data)
            elif new_status == "completed":
                await send_booking_completion_email(pet_owner, caregiver, service, booking_data)
        
        return {
            "message": f"Booking status updated to {new_status}",
            "booking_id": booking_id,
            "new_status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update booking status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update booking status")

@api_router.get("/bookings/{booking_id}/details", response_model=dict)
async def get_booking_details(
    booking_id: str, 
    current_user: dict = Depends(get_current_user), 
    db=Depends(get_db_client)
):
    """Get detailed booking information with all related data"""
    try:
        # Get booking with related data
        booking_result = await db.table("bookings").select("""
            *,
            users!bookings_pet_owner_id_fkey(first_name, last_name, email, phone),
            caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name, email, phone)),
            pets(*),
            caregiver_services(*)
        """).eq("id", booking_id).execute()
        
        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_result.data[0]
        
        # Check if user has permission to view this booking
        is_pet_owner = booking["pet_owner_id"] == current_user["user_id"]
        is_caregiver = booking["caregiver_profiles"]["user_id"] == current_user["user_id"]
        
        if not (is_pet_owner or is_caregiver):
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")
        
        # Get messages for this booking
        messages_result = await db.table("messages").select("*").eq("booking_id", booking_id).order("created_at").execute()
        
        return {
            "booking": booking,
            "messages": messages_result.data or [],
            "user_role": "pet_owner" if is_pet_owner else "caregiver"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get booking details error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get booking details")

@api_router.get("/bookings/upcoming", response_model=List[dict])
async def get_upcoming_bookings(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Get upcoming bookings for current user"""
    try:
        current_time = datetime.utcnow().isoformat()
        
        if current_user.get("user_type") == "pet_owner":
            result = await db.table("bookings").select("""
                *,
                caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name, profile_image_url)),
                pets(name, species, breed),
                caregiver_services(service_name, title)
            """).eq("pet_owner_id", current_user["user_id"]).gte("start_datetime", current_time).in_("booking_status", ["pending", "confirmed", "in_progress"]).order("start_datetime").execute()
        else:
            # Get caregiver profile first
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
            if not profile_result.data:
                return []
            
            caregiver_id = profile_result.data[0]["id"]
            result = await db.table("bookings").select("""
                *,
                users!bookings_pet_owner_id_fkey(first_name, last_name, profile_image_url),
                pets(name, species, breed),
                caregiver_services(service_name, title)
            """).eq("caregiver_id", caregiver_id).gte("start_datetime", current_time).in_("booking_status", ["pending", "confirmed", "in_progress"]).order("start_datetime").execute()
        
        return result.data or []
        
    except Exception as e:
        logger.error(f"Get upcoming bookings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get upcoming bookings")

@api_router.get("/bookings/history", response_model=List[dict])
async def get_booking_history(current_user: dict = Depends(get_current_user), db=Depends(get_db_client)):
    """Get booking history for current user"""
    try:
        if current_user.get("user_type") == "pet_owner":
            result = await db.table("bookings").select("""
                *,
                caregiver_profiles!inner(*, users!caregiver_profiles_user_id_fkey(first_name, last_name, profile_image_url)),
                pets(name, species, breed),
                caregiver_services(service_name, title)
            """).eq("pet_owner_id", current_user["user_id"]).in_("booking_status", ["completed", "cancelled", "rejected"]).order("created_at", desc=True).limit(50).execute()
        else:
            # Get caregiver profile first
            profile_result = await db.table("caregiver_profiles").select("id").eq("user_id", current_user["user_id"]).execute()
            if not profile_result.data:
                return []
            
            caregiver_id = profile_result.data[0]["id"] 
            result = await db.table("bookings").select("""
                *,
                users!bookings_pet_owner_id_fkey(first_name, last_name, profile_image_url),
                pets(name, species, breed),
                caregiver_services(service_name, title)
            """).eq("caregiver_id", caregiver_id).in_("booking_status", ["completed", "cancelled", "rejected"]).order("created_at", desc=True).limit(50).execute()
        
        return result.data or []
        
    except Exception as e:
        logger.error(f"Get booking history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get booking history")

# Email notification functions
async def send_booking_confirmation_email(pet_owner, caregiver, service, booking):
    """Send booking confirmation email to pet owner"""
    try:
        start_date = datetime.fromisoformat(booking["start_datetime"].replace('Z', '+00:00')).strftime("%B %d, %Y at %I:%M %p")
        
        await send_email(
            pet_owner["email"],
            "Booking Confirmed! 🎉",
            f"""
            <h2>Great News! Your booking has been confirmed!</h2>
            <p>Hi {pet_owner['first_name']}!</p>
            <p><strong>{caregiver['first_name']} {caregiver['last_name']}</strong> has confirmed your booking for <strong>{service['title']}</strong>.</p>
            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Booking Details:</h3>
                <p><strong>Service:</strong> {service['title']}</p>
                <p><strong>Date & Time:</strong> {start_date}</p>
                <p><strong>Total:</strong> ${booking['total_amount']}</p>
            </div>
            <p>You can now message your caregiver directly through the app!</p>
            """
        )
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

async def send_booking_rejection_email(pet_owner, caregiver, service, booking):
    """Send booking rejection email to pet owner"""
    try:
        await send_email(
            pet_owner["email"],
            "Booking Update - Unable to Confirm",
            f"""
            <h2>Booking Update</h2>
            <p>Hi {pet_owner['first_name']},</p>
            <p>Unfortunately, <strong>{caregiver['first_name']} {caregiver['last_name']}</strong> is unable to confirm your booking for <strong>{service['title']}</strong>.</p>
            <p>Don't worry! There are many other great caregivers available. You can search for alternative options in the app.</p>
            <p>If payment was processed, it will be automatically refunded within 3-5 business days.</p>
            """
        )
    except Exception as e:
        logger.error(f"Failed to send rejection email: {e}")

async def send_booking_completion_email(pet_owner, caregiver, service, booking):
    """Send booking completion email to both parties"""
    try:
        # Email to pet owner
        await send_email(
            pet_owner["email"],
            "Service Completed! Please Leave a Review ⭐",
            f"""
            <h2>Service Completed Successfully!</h2>
            <p>Hi {pet_owner['first_name']}!</p>
            <p>Your <strong>{service['title']}</strong> service with <strong>{caregiver['first_name']} {caregiver['last_name']}</strong> has been completed.</p>
            <p>We hope you and your pet had a wonderful experience!</p>
            <p><strong>Please take a moment to leave a review</strong> to help other pet owners and support your caregiver.</p>
            """
        )
        
        # Email to caregiver
        await send_email(
            caregiver["email"],
            "Service Completed - Payment Processing",
            f"""
            <h2>Service Completed!</h2>
            <p>Hi {caregiver['first_name']}!</p>
            <p>You've successfully completed the <strong>{service['title']}</strong> service for <strong>{pet_owner['first_name']}</strong>.</p>
            <p>Payment will be processed and transferred to your account within 2-3 business days.</p>
            <p>Thank you for providing excellent pet care!</p>
            """
        )
    except Exception as e:
        logger.error(f"Failed to send completion emails: {e}")


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