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
    def __init__(self, base_url: str = "https://8f2d6284-acf5-4a16-a61e-70911531e1fa.preview.emergentagent.com"):
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
        success, response = self.make_request('GET', '/api/auth/me', expected_status=403)  # Should return 403 without auth
        server_responding = success and response.get('detail') == 'Not authenticated'
        return self.log_test("Backend Server Health", server_responding, f"Server responding correctly")

    def test_user_registration(self):
        """Test user registration for both pet owner and caregiver"""
        print("\n🔍 Testing User Registration...")
        
        # Test pet owner registration
        timestamp = datetime.now().strftime("%H%M%S")
        pet_owner_data = {
            "email": f"petowner_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Pet Owner",
            "phone": "+65 9123 4567",
            "role": "pet_owner"
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
            "full_name": "Test Caregiver",
            "phone": "+65 9876 5432",
            "role": "caregiver"
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
        user_data_valid = success and 'email' in response and 'role' in response
        
        return self.log_test("Get Current User", user_data_valid, 
                           f"User role: {response.get('role', 'N/A')}")

    def test_pet_management(self):
        """Test pet creation and retrieval"""
        print("\n🔍 Testing Pet Management...")
        
        if not self.pet_owner_token:
            return self.log_test("Pet Management", False, "No pet owner token available")
        
        # Create a pet
        pet_data = {
            "name": "Buddy",
            "breed": "Golden Retriever",
            "age": 3,
            "weight": 25.5,
            "gender": "Male",
            "description": "Friendly and energetic dog",
            "medical_info": "Up to date on vaccinations",
            "behavioral_notes": "Good with children and other pets"
        }
        
        success, response = self.make_request('POST', '/api/pets', pet_data, 
                                            token=self.pet_owner_token, expected_status=200)
        if success and 'id' in response:
            self.pet_id = response['id']
        
        create_success = self.log_test("Pet Creation", success, f"Pet ID: {self.pet_id}")
        
        # Get user pets
        success, response = self.make_request('GET', '/api/pets', token=self.pet_owner_token)
        pets_retrieved = success and isinstance(response, list) and len(response) > 0
        
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

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting PetBnB Backend API Tests")
        print("=" * 50)
        
        # Run tests in order
        test_methods = [
            self.test_health_check,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_pet_management,
            self.test_caregiver_services,
            self.test_location_search,
            self.test_booking_creation,
            self.test_get_bookings,
            self.test_payment_intent,
            self.test_file_upload_endpoint
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
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
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = PetBnBAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())