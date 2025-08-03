#!/usr/bin/env python3
"""
PetBnB Backend API Testing Suite
Comprehensive testing of all backend endpoints
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class PetBnBAPITester:
    def __init__(self, base_url: str = "https://387c6cb1-495f-4442-86a9-09b27c6e460e.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test data storage
        self.pet_owner_token = None
        self.caregiver_token = None
        self.pet_owner_id = None
        self.caregiver_id = None
        self.pet_id = None
        self.service_id = None
        self.booking_id = None
        
        # Test counters
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {test_name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            'name': test_name,
            'success': success,
            'details': details
        })
        return success

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test if backend server is running"""
        print("\n🔍 Testing Backend Health Check...")
        
        # Test root endpoint first
        success, response = self.make_request('GET', '/', expected_status=200)
        root_success = self.log_test("Root Endpoint", success, f"Response: {response.get('message', 'N/A')}")
        
        # Test health endpoint
        success, response = self.make_request('GET', '/health', expected_status=200)
        health_success = self.log_test("Health Endpoint", success, f"Database: {response.get('database', 'N/A')}")
        
        # Test auth endpoint without token (should return 403)
        success, response = self.make_request('GET', '/api/auth/me', expected_status=403)
        auth_endpoint_exists = success and 'detail' in response
        auth_success = self.log_test("Auth Endpoint Exists", auth_endpoint_exists, f"Expected 403 response received")
        
        return root_success and health_success and auth_success

    def test_database_tables_exist(self):
        """Test if database tables exist by attempting operations"""
        print("\n🔍 Testing Database Tables Existence...")
        
        # Try to register a user - this will fail if users table doesn't exist
        timestamp = datetime.now().strftime("%H%M%S")
        test_user_data = {
            "email": f"tabletest_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Table",
            "last_name": "Test",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', test_user_data, expected_status=200)
        
        if success:
            return self.log_test("Database Tables", True, "Users table exists and registration works")
        else:
            error_detail = response.get('detail', str(response))
            if 'relation' in error_detail.lower() and 'does not exist' in error_detail.lower():
                return self.log_test("Database Tables", False, f"Tables missing: {error_detail}")
            elif 'table' in error_detail.lower() and 'exist' in error_detail.lower():
                return self.log_test("Database Tables", False, f"Tables missing: {error_detail}")
            else:
                return self.log_test("Database Tables", False, f"Unknown error: {error_detail}")

    def test_demo_account_login(self):
        """Test login with demo accounts"""
        print("\n🔍 Testing Demo Account Login...")
        
        demo_accounts = [
            {"email": "john.petowner@demo.com", "password": "TestPassword123!", "role": "pet_owner"},
            {"email": "sarah.caregiver@demo.com", "password": "TestPassword123!", "role": "caregiver"}
        ]
        
        login_results = []
        
        for account in demo_accounts:
            login_data = {
                "email": account["email"],
                "password": account["password"]
            }
            
            success, response = self.make_request('POST', '/api/auth/login', login_data, expected_status=200)
            
            if success and 'access_token' in response:
                # Store token for further testing
                if account["role"] == "pet_owner":
                    self.pet_owner_token = response['access_token']
                    self.pet_owner_id = response['user_id']
                else:
                    self.caregiver_token = response['access_token']
                    self.caregiver_id = response['user_id']
                
                login_results.append(self.log_test(f"Demo Login ({account['role']})", True, 
                                                 f"Token received for {account['email']}"))
            else:
                error_detail = response.get('detail', str(response))
                login_results.append(self.log_test(f"Demo Login ({account['role']})", False, 
                                                 f"Failed for {account['email']}: {error_detail}"))
        
        return all(login_results)

    def test_token_validation_detailed(self):
        """Test token validation in detail"""
        print("\n🔍 Testing Token Validation...")
        
        if not self.pet_owner_token:
            return self.log_test("Token Validation", False, "No token available for testing")
        
        # Test with valid token
        success, response = self.make_request('GET', '/api/auth/me', token=self.pet_owner_token, expected_status=200)
        
        if success:
            valid_token_test = self.log_test("Valid Token Test", True, 
                                           f"User: {response.get('email', 'N/A')}, Role: {response.get('user_type', 'N/A')}")
        else:
            error_detail = response.get('detail', str(response))
            if 'expired' in error_detail.lower():
                valid_token_test = self.log_test("Valid Token Test", False, f"Token expired: {error_detail}")
            elif 'invalid' in error_detail.lower():
                valid_token_test = self.log_test("Valid Token Test", False, f"Token invalid: {error_detail}")
            else:
                valid_token_test = self.log_test("Valid Token Test", False, f"Auth failed: {error_detail}")
        
        # Test with invalid token
        success, response = self.make_request('GET', '/api/auth/me', token="invalid_token_123", expected_status=401)
        invalid_token_test = self.log_test("Invalid Token Rejection", success, 
                                         f"Correctly rejected invalid token")
        
        # Test with expired token format (but not actually expired)
        success, response = self.make_request('GET', '/api/auth/me', token="", expected_status=403)
        empty_token_test = self.log_test("Empty Token Rejection", success, 
                                       f"Correctly rejected empty token")
        
        return valid_token_test and invalid_token_test and empty_token_test

    def test_jwt_token_creation(self):
        """Test JWT token creation and structure"""
        print("\n🔍 Testing JWT Token Creation...")
        
        # Create a new user to get a fresh token
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"jwttest_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "JWT",
            "last_name": "Test",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data, expected_status=200)
        
        if not success:
            return self.log_test("JWT Token Creation", False, f"Registration failed: {response.get('detail', 'Unknown error')}")
        
        token = response.get('access_token')
        if not token:
            return self.log_test("JWT Token Creation", False, "No access token in response")
        
        # Verify token structure (JWT should have 3 parts separated by dots)
        token_parts = token.split('.')
        structure_valid = len(token_parts) == 3
        
        structure_test = self.log_test("JWT Token Structure", structure_valid, 
                                     f"Token has {len(token_parts)} parts (expected 3)")
        
        # Test immediate token usage
        success, user_response = self.make_request('GET', '/api/auth/me', token=token, expected_status=200)
        immediate_use_test = self.log_test("Immediate Token Usage", success, 
                                         f"Token works immediately after creation")
        
        return structure_test and immediate_use_test

    def test_user_registration(self):
        """Test user registration for both pet owner and caregiver"""
        print("\n🔍 Testing User Registration...")
        
        # Test pet owner registration
        timestamp = datetime.now().strftime("%H%M%S")
        pet_owner_data = {
            "email": f"petowner_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "PetOwner",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', pet_owner_data, expected_status=200)
        if success and 'access_token' in response:
            self.pet_owner_token = response['access_token']
            self.pet_owner_id = response['user_id']
        
        pet_owner_success = self.log_test("Pet Owner Registration", success, 
                                        f"Token received: {bool(self.pet_owner_token)}")
        
        # Test caregiver registration
        caregiver_data = {
            "email": f"caregiver_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "Caregiver", 
            "phone": "+65 9876 5432",
            "user_type": "caregiver"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', caregiver_data, expected_status=200)
        if success and 'access_token' in response:
            self.caregiver_token = response['access_token']
            self.caregiver_id = response['user_id']
        
        caregiver_success = self.log_test("Caregiver Registration", success, 
                                        f"Token received: {bool(self.caregiver_token)}")
        
        return pet_owner_success and caregiver_success

    def test_user_login(self):
        """Test user login functionality"""
        print("\n🔍 Testing User Login...")
        
        # We'll test with invalid credentials first
        invalid_login_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.make_request('POST', '/api/auth/login', invalid_login_data, expected_status=401)
        return self.log_test("Invalid Login Rejection", success, "Correctly rejected invalid credentials")

    def test_get_current_user(self):
        """Test getting current user info"""
        print("\n🔍 Testing Get Current User...")
        
        if not self.pet_owner_token:
            return self.log_test("Get Current User", False, "No pet owner token available")
        
        success, response = self.make_request('GET', '/api/auth/me', token=self.pet_owner_token)
        user_data_valid = success and 'email' in response and 'user_type' in response
        
        return self.log_test("Get Current User", user_data_valid, 
                           f"User type: {response.get('user_type', 'N/A')}")

    def test_email_verification_system(self):
        """Test email verification system"""
        print("\n🔍 Testing Email Verification System...")
        
        # Test verification status endpoint
        if not self.pet_owner_token:
            return self.log_test("Email Verification System", False, "No pet owner token available")
        
        # Get verification status
        success, response = self.make_request('GET', '/api/auth/verification-status', 
                                            token=self.pet_owner_token, expected_status=200)
        
        status_success = self.log_test("Get Verification Status", success, 
                                     f"Status: {response.get('verification_status', {}).get('email_verified', 'N/A')}")
        
        # Test resend verification endpoint
        success, response = self.make_request('POST', '/api/auth/resend-verification', 
                                            token=self.pet_owner_token, expected_status=200)
        
        resend_success = self.log_test("Resend Verification Email", success, 
                                     f"Message: {response.get('message', 'N/A')}")
        
        # Test email verification endpoint with invalid token
        verification_data = {"token": "invalid_token_123"}
        success, response = self.make_request('POST', '/api/auth/verify-email', verification_data, 
                                            expected_status=400)
        
        invalid_token_success = self.log_test("Invalid Verification Token", success, 
                                            "Correctly rejected invalid token")
        
        return status_success and resend_success and invalid_token_success

    def test_oauth_integration(self):
        """Test OAuth integration endpoints"""
        print("\n🔍 Testing OAuth Integration...")
        
        # Test OAuth endpoint with missing session_id
        oauth_data = {"user_type": "pet_owner"}
        success, response = self.make_request('POST', '/api/auth/oauth/emergent', oauth_data, 
                                            expected_status=400)
        
        missing_session_success = self.log_test("OAuth Missing Session ID", success, 
                                               "Correctly rejected missing session_id")
        
        # Test OAuth endpoint with invalid session_id
        oauth_data = {"session_id": "invalid_session_123", "user_type": "pet_owner"}
        success, response = self.make_request('POST', '/api/auth/oauth/emergent', oauth_data, 
                                            expected_status=401)
        
        invalid_session_success = self.log_test("OAuth Invalid Session", success, 
                                               "Correctly rejected invalid session")
        
        return missing_session_success and invalid_session_success

    def test_id_verification_system(self):
        """Test ID verification system for caregivers"""
        print("\n🔍 Testing ID Verification System...")
        
        if not self.caregiver_token:
            return self.log_test("ID Verification System", False, "No caregiver token available")
        
        # Test ID verification status endpoint
        success, response = self.make_request('GET', '/api/caregiver/id-verification-status', 
                                            token=self.caregiver_token, expected_status=200)
        
        status_success = self.log_test("Get ID Verification Status", success, 
                                     f"Status: {response.get('status', 'N/A')}")
        
        # Test ID verification submission with missing data
        verification_data = {"document_type": "nric"}  # Missing required fields
        success, response = self.make_request('POST', '/api/caregiver/submit-id-verification', 
                                            verification_data, token=self.caregiver_token, 
                                            expected_status=400)
        
        missing_data_success = self.log_test("ID Verification Missing Data", success, 
                                           "Correctly rejected incomplete data")
        
        # Test ID verification submission with invalid document type
        verification_data = {
            "document_type": "invalid_type",
            "id_document_url": "https://example.com/id.jpg",
            "selfie_url": "https://example.com/selfie.jpg"
        }
        success, response = self.make_request('POST', '/api/caregiver/submit-id-verification', 
                                            verification_data, token=self.caregiver_token, 
                                            expected_status=400)
        
        invalid_type_success = self.log_test("ID Verification Invalid Type", success, 
                                           "Correctly rejected invalid document type")
        
        # Test with pet owner token (should fail)
        if self.pet_owner_token:
            success, response = self.make_request('GET', '/api/caregiver/id-verification-status', 
                                                token=self.pet_owner_token, expected_status=403)
            
            role_restriction_success = self.log_test("ID Verification Role Restriction", success, 
                                                   "Correctly restricted to caregivers only")
        else:
            role_restriction_success = True
        
        return status_success and missing_data_success and invalid_type_success and role_restriction_success

    def test_verification_requirements(self):
        """Test that verification is required for key operations"""
        print("\n🔍 Testing Verification Requirements...")
        
        # Create a new unverified user for testing
        timestamp = datetime.now().strftime("%H%M%S")
        unverified_user_data = {
            "email": f"unverified_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Unverified",
            "last_name": "User",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', unverified_user_data, 
                                            expected_status=200)
        
        if not success or 'access_token' not in response:
            return self.log_test("Verification Requirements", False, "Failed to create test user")
        
        unverified_token = response['access_token']
        
        # Test pet creation without email verification (should fail)
        pet_data = {
            "name": "Test Pet",
            "species": "dog",
            "breed": "Test Breed",
            "age": 2,
            "weight": 15.0,
            "gender": "male",
            "description": "Test pet for verification",
            "owner_id": response['user_id']
        }
        
        success, response = self.make_request('POST', '/api/pets', pet_data, 
                                            token=unverified_token, expected_status=403)
        
        pet_verification_success = self.log_test("Pet Creation Verification Required", success, 
                                               "Correctly blocked unverified user from creating pets")
        
        # Test booking creation without email verification (should fail)
        if self.service_id:
            booking_data = {
                "pet_ids": ["test-pet-id"],
                "service_id": self.service_id,
                "start_datetime": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "end_datetime": (datetime.utcnow() + timedelta(days=1, hours=2)).isoformat(),
                "total_amount": 50.0,
                "pet_owner_id": response['user_id'],
                "caregiver_id": "test-caregiver-id",
                "pet_id": "test-pet-id"
            }
            
            success, response = self.make_request('POST', '/api/bookings', booking_data, 
                                                token=unverified_token, expected_status=403)
            
            booking_verification_success = self.log_test("Booking Creation Verification Required", success, 
                                                       "Correctly blocked unverified user from creating bookings")
        else:
            booking_verification_success = True
        
        return pet_verification_success and booking_verification_success

    def test_caregiver_service_verification_requirements(self):
        """Test that caregiver service creation requires both email and ID verification"""
        print("\n🔍 Testing Caregiver Service Verification Requirements...")
        
        if not self.caregiver_token:
            return self.log_test("Caregiver Service Verification", False, "No caregiver token available")
        
        # Test service creation (should fail due to verification requirements)
        service_data = {
            "service_type": "pet_boarding",
            "service_name": "Test Boarding Service",
            "title": "Professional Pet Boarding",
            "description": "Safe and comfortable boarding for your pets",
            "base_price": 50.0,
            "duration_minutes": 1440,
            "max_pets": 3,
            "service_area_radius": 15.0,
            "caregiver_id": self.caregiver_id
        }
        
        success, response = self.make_request('POST', '/api/caregiver/services', service_data,
                                            token=self.caregiver_token, expected_status=403)
        
        return self.log_test("Caregiver Service Verification Required", success, 
                           "Correctly blocked unverified caregiver from creating services")

    def test_pet_management(self):
        """Test pet creation and retrieval with verification requirements"""
        print("\n🔍 Testing Pet Management...")
        
        if not self.pet_owner_token:
            return self.log_test("Pet Management", False, "No pet owner token available")
        
        # Test pet creation (may fail due to email verification requirement)
        pet_data = {
            "name": "Buddy",
            "species": "dog",
            "breed": "Golden Retriever",
            "age": 3,
            "weight": 25.5,
            "gender": "male",
            "description": "Friendly and energetic dog",
            "medical_info": "Up to date on vaccinations",
            "behavioral_notes": "Good with children and other pets",
            "owner_id": self.pet_owner_id
        }
        
        # Try to create pet - might fail due to verification requirements
        success, response = self.make_request('POST', '/api/pets', pet_data, 
                                            token=self.pet_owner_token)
        
        if success and 'id' in response:
            self.pet_id = response['id']
            create_success = self.log_test("Pet Creation", True, f"Pet ID: {self.pet_id}")
        elif response.get('detail') == "Email verification required to create pets":
            create_success = self.log_test("Pet Creation Verification Block", True, 
                                         "Correctly blocked pet creation due to email verification requirement")
        else:
            create_success = self.log_test("Pet Creation", False, f"Unexpected error: {response.get('detail', 'Unknown')}")
        
        # Get user pets
        success, response = self.make_request('GET', '/api/pets', token=self.pet_owner_token)
        pets_retrieved = success and isinstance(response, list)
        
        get_success = self.log_test("Get User Pets", pets_retrieved, 
                                  f"Retrieved {len(response) if isinstance(response, list) else 0} pets")
        
        return create_success and get_success

    def test_caregiver_services(self):
        """Test caregiver service creation"""
        print("\n🔍 Testing Caregiver Services...")
        
        if not self.caregiver_token:
            return self.log_test("Caregiver Services", False, "No caregiver token available")
        
        # Create a service
        service_data = {
            "service_type": "pet_boarding",
            "title": "Professional Pet Boarding",
            "description": "Safe and comfortable boarding for your pets",
            "base_price": 50.0,
            "duration_minutes": 1440,  # 24 hours
            "max_pets": 3,
            "service_area_radius": 15.0
        }
        
        success, response = self.make_request('POST', '/api/caregiver/services', service_data,
                                            token=self.caregiver_token, expected_status=200)
        if success and 'id' in response:
            self.service_id = response['id']
        
        create_success = self.log_test("Service Creation", success, f"Service ID: {self.service_id}")
        
        # Get caregiver services
        success, response = self.make_request('GET', '/api/caregiver/services', 
                                            token=self.caregiver_token)
        services_retrieved = success and isinstance(response, list) and len(response) > 0
        
        get_success = self.log_test("Get Caregiver Services", services_retrieved,
                                  f"Retrieved {len(response) if isinstance(response, list) else 0} services")
        
        return create_success and get_success

    def test_location_search(self):
        """Test location-based caregiver search"""
        print("\n🔍 Testing Location Search...")
        
        # Search for caregivers in Singapore area
        search_data = {
            "latitude": 1.3521,
            "longitude": 103.8198,
            "radius": 20.0,
            "service_type": "pet_boarding"
        }
        
        success, response = self.make_request('POST', '/api/search/location', search_data)
        search_works = success and isinstance(response, list)
        
        return self.log_test("Location Search", search_works,
                           f"Found {len(response) if isinstance(response, list) else 0} caregivers")

    def test_booking_creation(self):
        """Test booking creation"""
        print("\n🔍 Testing Booking Creation...")
        
        if not self.pet_owner_token or not self.service_id or not self.pet_id:
            return self.log_test("Booking Creation", False, 
                               "Missing required data (tokens, service_id, or pet_id)")
        
        # Create a booking
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=24)
        
        booking_data = {
            "pet_ids": [self.pet_id],
            "service_id": self.service_id,
            "start_datetime": start_time.isoformat(),
            "end_datetime": end_time.isoformat(),
            "total_amount": 50.0,
            "special_requirements": "Please provide extra attention to feeding schedule"
        }
        
        success, response = self.make_request('POST', '/api/bookings', booking_data,
                                            token=self.pet_owner_token, expected_status=200)
        if success and 'id' in response:
            self.booking_id = response['id']
        
        return self.log_test("Booking Creation", success, f"Booking ID: {self.booking_id}")

    def test_get_bookings(self):
        """Test getting user bookings"""
        print("\n🔍 Testing Get Bookings...")
        
        if not self.pet_owner_token:
            return self.log_test("Get Bookings", False, "No pet owner token available")
        
        success, response = self.make_request('GET', '/api/bookings', token=self.pet_owner_token)
        bookings_retrieved = success and isinstance(response, list)
        
        return self.log_test("Get User Bookings", bookings_retrieved,
                           f"Retrieved {len(response) if isinstance(response, list) else 0} bookings")

    def test_payment_intent(self):
        """Test Stripe payment intent creation"""
        print("\n🔍 Testing Payment Intent...")
        
        if not self.pet_owner_token or not self.booking_id:
            return self.log_test("Payment Intent", False, "Missing booking_id or token")
        
        # Note: This might fail if Stripe keys are not properly configured
        success, response = self.make_request('POST', f'/api/payments/create-intent?booking_id={self.booking_id}',
                                            token=self.pet_owner_token)
        
        payment_intent_created = success and 'client_secret' in response
        
        return self.log_test("Payment Intent Creation", payment_intent_created,
                           "Stripe integration test")

    def test_file_upload_endpoint(self):
        """Test file upload endpoint structure (without actual file)"""
        print("\n🔍 Testing File Upload Endpoint...")
        
        if not self.pet_owner_token:
            return self.log_test("File Upload Endpoint", False, "No token available")
        
        # Test without file (should return error but endpoint should exist)
        success, response = self.make_request('POST', '/api/upload', token=self.pet_owner_token, 
                                            expected_status=422)  # Expect validation error
        
        endpoint_exists = success  # 422 means endpoint exists but validation failed
        
        return self.log_test("File Upload Endpoint", endpoint_exists,
                           "Endpoint accessible (validation error expected)")

    def test_messaging_system(self):
        """Test messaging system endpoints"""
        print("\n🔍 Testing Messaging System...")
        
        if not self.pet_owner_token or not self.caregiver_token or not self.booking_id:
            return self.log_test("Messaging System", False, 
                               "Missing required data (tokens or booking_id)")
        
        # Send a message from pet owner to caregiver
        message_data = {
            "booking_id": self.booking_id,
            "receiver_id": self.caregiver_id,
            "content": "Hello! Looking forward to the booking.",
            "message_type": "text"
        }
        
        success, response = self.make_request('POST', '/api/messages', message_data,
                                            token=self.pet_owner_token, expected_status=200)
        
        send_success = self.log_test("Send Message", success, 
                                   f"Message sent: {response.get('id', 'N/A')}")
        
        # Get messages for the booking
        success, response = self.make_request('GET', f'/api/messages/{self.booking_id}',
                                            token=self.pet_owner_token)
        
        messages_retrieved = success and isinstance(response, list) and len(response) > 0
        
        get_success = self.log_test("Get Booking Messages", messages_retrieved,
                                  f"Retrieved {len(response) if isinstance(response, list) else 0} messages")
        
        return send_success and get_success

    def run_all_tests(self):
        """Run all backend tests with focus on authentication"""
        print("🚀 Starting PetBnB Backend API Tests - Authentication Focus")
        print("=" * 60)
        
        # Run tests in order - prioritizing authentication tests
        test_methods = [
            self.test_health_check,
            self.test_database_tables_exist,
            self.test_demo_account_login,
            self.test_user_registration,
            self.test_jwt_token_creation,
            self.test_token_validation_detailed,
            self.test_user_login,
            self.test_get_current_user,
            self.test_pet_management,
            self.test_caregiver_services,
            self.test_location_search,
            self.test_booking_creation,
            self.test_get_bookings,
            self.test_messaging_system,
            self.test_payment_intent,
            self.test_file_upload_endpoint
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY - AUTHENTICATION FOCUS")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        # Print authentication-specific summary
        auth_tests = [test for test in self.test_results if 'auth' in test['name'].lower() or 'token' in test['name'].lower() or 'login' in test['name'].lower()]
        auth_passed = len([test for test in auth_tests if test['success']])
        auth_total = len(auth_tests)
        
        print(f"\n🔐 AUTHENTICATION TESTS: {auth_passed}/{auth_total} passed")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = PetBnBAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())