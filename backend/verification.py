"""
Email and ID verification system for PetBnB
"""

import os
import uuid
import asyncio
import httpx
import smtplib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from supabase import AsyncClient
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class VerificationService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL')
        self.frontend_url = os.getenv('FRONTEND_URL')
    
    async def create_email_verification_token(self, db: AsyncClient, user_id: str, email: str) -> str:
        """Create email verification token"""
        try:
            verification_token = str(uuid.uuid4())
            expires_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
            
            # Store verification token
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
            return verification_token
            
        except Exception as e:
            logger.error(f"Failed to create verification token: {e}")
            raise HTTPException(status_code=500, detail="Failed to create verification token")
    
    async def send_verification_email(self, email: str, verification_token: str, user_name: str):
        """Send email verification email"""
        try:
            verification_url = f"{self.frontend_url}/verify-email?token={verification_token}"
            
            subject = "Verify Your PetBnB Account"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                    .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; background-color: #f9f9f9; }}
                    .button {{ 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #4F46E5; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        margin: 20px 0;
                    }}
                    .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 Welcome to PetBnB!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {user_name}!</h2>
                        <p>Thank you for joining PetBnB! Please verify your email address to complete your account setup.</p>
                        <p>Click the button below to verify your email:</p>
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                        <p>Or copy and paste this link in your browser:</p>
                        <p><a href="{verification_url}">{verification_url}</a></p>
                        <p><strong>Important:</strong> You need to verify your email before you can:</p>
                        <ul>
                            <li>Create bookings (for pet owners)</li>
                            <li>Create services (for caregivers)</li>
                            <li>Access full platform features</li>
                        </ul>
                        <p>This verification link will expire in 24 hours.</p>
                    </div>
                    <div class="footer">
                        <p>If you didn't create an account with PetBnB, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg = MimeMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = email
            msg['Subject'] = subject
            
            html_part = MimeText(html_body, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Verification email sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    async def verify_email_token(self, db: AsyncClient, verification_token: str) -> bool:
        """Verify email token and update user"""
        try:
            # Get verification token
            result = await db.table("verification_tokens").select("*").eq("verification_token", verification_token).eq("is_used", False).execute()
            
            if not result.data:
                return False
            
            token_data = result.data[0]
            
            # Check if token expired
            expires_at = datetime.fromisoformat(token_data["expires_at"].replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                return False
            
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
            
            logger.info(f"Email verified for user {token_data['user_id']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to verify email token: {e}")
            return False
    
    async def create_id_verification_request(self, db: AsyncClient, user_id: str, id_document_url: str, selfie_url: str, document_type: str) -> str:
        """Create ID verification request for caregivers"""
        try:
            verification_id = str(uuid.uuid4())
            
            verification_data = {
                "id": verification_id,
                "user_id": user_id,
                "document_type": document_type,  # "nric", "passport"
                "id_document_url": id_document_url,
                "selfie_url": selfie_url,
                "verification_status": "pending",  # "pending", "approved", "rejected"
                "submitted_at": datetime.utcnow().isoformat(),
                "admin_notes": None,
                "verified_at": None,
                "verified_by": None
            }
            
            await db.table("id_verifications").insert(verification_data).execute()
            
            # Update caregiver profile to indicate ID verification submitted
            await db.table("caregiver_profiles").update({
                "id_verification_status": "pending",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            
            logger.info(f"ID verification request created for user {user_id}")
            return verification_id
            
        except Exception as e:
            logger.error(f"Failed to create ID verification request: {e}")
            raise HTTPException(status_code=500, detail="Failed to submit ID verification")
    
    async def check_user_verification_status(self, db: AsyncClient, user_id: str) -> Dict[str, Any]:
        """Check user's verification status"""
        try:
            # Get user info
            user_result = await db.table("users").select("*").eq("id", user_id).execute()
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
                profile_result = await db.table("caregiver_profiles").select("*").eq("user_id", user_id).execute()
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
            
            return verification_status
            
        except Exception as e:
            logger.error(f"Failed to check verification status: {e}")
            raise HTTPException(status_code=500, detail="Failed to check verification status")

class OAuthService:
    """Handle OAuth integration with Emergent Auth"""
    
    def __init__(self):
        self.emergent_auth_url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    
    async def verify_emergent_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Verify Emergent Auth session and get user data"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.emergent_auth_url,
                    headers={"X-Session-ID": session_id}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Emergent Auth verification failed: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Failed to verify Emergent session: {e}")
            return None
    
    async def create_or_update_oauth_user(self, db: AsyncClient, oauth_data: Dict[str, Any], user_type: str = "pet_owner") -> Dict[str, Any]:
        """Create or update user from OAuth data"""
        try:
            email = oauth_data.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="No email in OAuth data")
            
            # Check if user exists
            existing_user = await db.table("users").select("*").eq("email", email).execute()
            
            if existing_user.data:
                # User exists, return existing user
                user = existing_user.data[0]
                logger.info(f"Existing OAuth user logged in: {email}")
                return user
            else:
                # Create new user
                names = oauth_data.get("name", "").split(" ", 1)
                first_name = names[0] if names else "User"
                last_name = names[1] if len(names) > 1 else ""
                
                user_data = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "password_hash": "",  # OAuth users don't have password
                    "first_name": first_name,
                    "last_name": last_name,
                    "user_type": user_type,
                    "profile_image_url": oauth_data.get("picture"),
                    "is_active": True,
                    "email_verified": False,  # Still need email verification even for OAuth
                    "oauth_provider": "emergent",
                    "oauth_id": oauth_data.get("id"),
                    "created_at": datetime.utcnow().isoformat()
                }
                
                result = await db.table("users").insert(user_data).execute()
                if not result.data:
                    raise HTTPException(status_code=500, detail="Failed to create OAuth user")
                
                created_user = result.data[0]
                
                # Create caregiver profile if needed
                if user_type == "caregiver":
                    caregiver_profile = {
                        "id": str(uuid.uuid4()),
                        "user_id": created_user["id"],
                        "bio": "",
                        "experience_years": 0,
                        "certifications": {},
                        "portfolio_images": [],
                        "availability_schedule": {},
                        "rating": 0.0,
                        "total_reviews": 0,
                        "background_check_verified": False,
                        "id_verification_status": "not_submitted",
                        "insurance_info": None,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    await db.table("caregiver_profiles").insert(caregiver_profile).execute()
                
                logger.info(f"New OAuth user created: {email}")
                return created_user
                
        except Exception as e:
            logger.error(f"Failed to create/update OAuth user: {e}")
            raise HTTPException(status_code=500, detail="Failed to process OAuth user")

# Create global instances
verification_service = VerificationService()
oauth_service = OAuthService()