#!/usr/bin/env python3
"""
PetBnB Registration System Testing Suite
Focus on testing registration validation errors and field compatibility
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class RegistrationTester:
    def __init__(self, base_url: str = "https://387c6cb1-495f-4442-86a9-09b27c6e460e.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
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
            if method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
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

    def test_registration_short_password(self):
        """Test registration with short password (demo123 - less than 8 characters)"""
        print("\n🔍 Testing Registration with Short Password...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"shortpass_{timestamp}@test.com",
            "password": "demo123",  # Only 7 characters - should fail
            "first_name": "Short",
            "last_name": "Password",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data, expected_status=422)
        
        if success:
            error_detail = response.get('detail', '')
            # Check if error message is readable and mentions password length
            if isinstance(error_detail, str) and ('8' in error_detail or 'password' in error_detail.lower()):
                return self.log_test("Short Password Validation", True, 
                                   f"Readable error: {error_detail}")
            elif isinstance(error_detail, list):
                # Check if it's a list of validation errors
                password_errors = [err for err in error_detail if 'password' in str(err).lower()]
                if password_errors:
                    return self.log_test("Short Password Validation", True, 
                                       f"Validation errors found: {password_errors}")
                else:
                    return self.log_test("Short Password Validation", False, 
                                       f"No password validation error found: {error_detail}")
            else:
                return self.log_test("Short Password Validation", False, 
                                   f"Error format not readable: {error_detail}")
        else:
            return self.log_test("Short Password Validation", False, 
                               f"Expected 422 status but got: {response}")

    def test_registration_missing_fields(self):
        """Test registration with missing required fields"""
        print("\n🔍 Testing Registration with Missing Fields...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test missing email
        user_data_no_email = {
            "password": "ValidPass123!",
            "first_name": "Missing",
            "last_name": "Email",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_no_email, expected_status=422)
        missing_email_test = self.log_test("Missing Email Field", success, 
                                         f"Error: {response.get('detail', 'N/A')}")
        
        # Test missing password
        user_data_no_password = {
            "email": f"nopass_{timestamp}@test.com",
            "first_name": "Missing",
            "last_name": "Password",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_no_password, expected_status=422)
        missing_password_test = self.log_test("Missing Password Field", success, 
                                            f"Error: {response.get('detail', 'N/A')}")
        
        # Test missing first_name
        user_data_no_firstname = {
            "email": f"nofirst_{timestamp}@test.com",
            "password": "ValidPass123!",
            "last_name": "Name",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_no_firstname, expected_status=422)
        missing_firstname_test = self.log_test("Missing First Name Field", success, 
                                             f"Error: {response.get('detail', 'N/A')}")
        
        return missing_email_test and missing_password_test and missing_firstname_test

    def test_registration_invalid_email(self):
        """Test registration with invalid email format"""
        print("\n🔍 Testing Registration with Invalid Email...")
        
        invalid_emails = [
            "invalid-email",
            "invalid@",
            "@invalid.com",
            "invalid.email.com",
            "invalid@.com"
        ]
        
        results = []
        for i, invalid_email in enumerate(invalid_emails):
            user_data = {
                "email": invalid_email,
                "password": "ValidPass123!",
                "first_name": "Invalid",
                "last_name": f"Email{i}",
                "phone": "+65 9123 4567",
                "user_type": "pet_owner"
            }
            
            success, response = self.make_request('POST', '/api/auth/register', user_data, expected_status=422)
            results.append(self.log_test(f"Invalid Email ({invalid_email})", success, 
                                       f"Error: {response.get('detail', 'N/A')}"))
        
        return all(results)

    def test_registration_valid_data(self):
        """Test registration with valid data"""
        print("\n🔍 Testing Registration with Valid Data...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test with minimum valid password (8 characters)
        user_data_min_pass = {
            "email": f"validmin_{timestamp}@test.com",
            "password": "Pass123!",  # Exactly 8 characters
            "first_name": "Valid",
            "last_name": "MinPass",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_min_pass, expected_status=200)
        
        if success:
            # Check response format
            has_token = 'access_token' in response
            has_user_id = 'user_id' in response
            token_type_correct = response.get('token_type') == 'bearer'
            
            min_pass_test = self.log_test("Valid Registration (Min Password)", 
                                        has_token and has_user_id and token_type_correct,
                                        f"Token: {bool(has_token)}, User ID: {bool(has_user_id)}")
        else:
            min_pass_test = self.log_test("Valid Registration (Min Password)", False, 
                                        f"Registration failed: {response.get('detail', 'Unknown error')}")
        
        # Test with longer valid password and all fields
        user_data_full = {
            "email": f"validfull_{timestamp}@test.com",
            "password": "ValidPassword123!",
            "first_name": "Valid",
            "last_name": "FullData",
            "phone": "+65 9876 5432",
            "user_type": "caregiver"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_full, expected_status=200)
        
        if success:
            # Check response format
            has_token = 'access_token' in response
            has_user_id = 'user_id' in response
            token_type_correct = response.get('token_type') == 'bearer'
            
            full_data_test = self.log_test("Valid Registration (Full Data)", 
                                         has_token and has_user_id and token_type_correct,
                                         f"Token: {bool(has_token)}, User ID: {bool(has_user_id)}")
            
            # Test immediate token usage
            if has_token:
                token = response['access_token']
                success, user_response = self.make_request('GET', '/api/auth/me', token=token, expected_status=200)
                
                if success:
                    # Check if user data has correct field format
                    has_first_name = 'first_name' in user_response
                    has_last_name = 'last_name' in user_response
                    has_email = 'email' in user_response
                    has_user_type = 'user_type' in user_response
                    
                    field_format_test = self.log_test("Field Format Compatibility", 
                                                    has_first_name and has_last_name and has_email and has_user_type,
                                                    f"Fields: first_name={has_first_name}, last_name={has_last_name}")
                else:
                    field_format_test = self.log_test("Field Format Compatibility", False, 
                                                    f"Token validation failed: {user_response.get('detail', 'Unknown')}")
            else:
                field_format_test = False
        else:
            full_data_test = self.log_test("Valid Registration (Full Data)", False, 
                                         f"Registration failed: {response.get('detail', 'Unknown error')}")
            field_format_test = False
        
        return min_pass_test and full_data_test and field_format_test

    def test_email_verification_token_creation(self):
        """Test that email verification token is created during registration"""
        print("\n🔍 Testing Email Verification Token Creation...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"verifytest_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Verify",
            "last_name": "Test",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data, expected_status=200)
        
        if not success:
            return self.log_test("Email Verification Token Creation", False, 
                               f"Registration failed: {response.get('detail', 'Unknown')}")
        
        token = response.get('access_token')
        if not token:
            return self.log_test("Email Verification Token Creation", False, "No access token received")
        
        # Check verification status
        success, verify_response = self.make_request('GET', '/api/auth/verification-status', 
                                                   token=token, expected_status=200)
        
        if success:
            verification_status = verify_response.get('verification_status', {})
            email_verified = verification_status.get('email_verified', True)  # New users should be unverified
            
            # For new users, email should NOT be verified initially (verification token should be created)
            token_created = not email_verified  # If email is not verified, token was created
            
            return self.log_test("Email Verification Token Creation", token_created,
                               f"Email verified status: {email_verified} (should be False for new users)")
        else:
            return self.log_test("Email Verification Token Creation", False,
                               f"Failed to check verification status: {verify_response.get('detail', 'Unknown')}")

    def test_mobile_app_field_compatibility(self):
        """Test mobile app field compatibility (first_name/last_name vs full_name)"""
        print("\n🔍 Testing Mobile App Field Compatibility...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test mobile app format (first_name/last_name separate)
        mobile_user_data = {
            "email": f"mobile_{timestamp}@test.com",
            "password": "MobilePass123!",
            "first_name": "Mobile",
            "last_name": "User",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', mobile_user_data, expected_status=200)
        
        if not success:
            return self.log_test("Mobile App Field Compatibility", False, 
                               f"Mobile registration failed: {response.get('detail', 'Unknown')}")
        
        token = response.get('access_token')
        if not token:
            return self.log_test("Mobile App Field Compatibility", False, "No access token received")
        
        # Test /api/auth/me response format for mobile compatibility
        success, user_response = self.make_request('GET', '/api/auth/me', token=token, expected_status=200)
        
        if success:
            # Check mobile app expected fields
            expected_fields = ['id', 'first_name', 'last_name', 'email', 'user_type', 'email_verified']
            missing_fields = [field for field in expected_fields if field not in user_response]
            
            # Check that there's no 'full_name' field (which would cause mobile app issues)
            has_full_name = 'full_name' in user_response
            
            mobile_compatible = len(missing_fields) == 0 and not has_full_name
            
            return self.log_test("Mobile App Field Compatibility", mobile_compatible,
                               f"Missing fields: {missing_fields}, Has full_name: {has_full_name}")
        else:
            return self.log_test("Mobile App Field Compatibility", False,
                               f"Failed to get user info: {user_response.get('detail', 'Unknown')}")

    def test_error_message_formatting(self):
        """Test that Pydantic validation errors are properly formatted"""
        print("\n🔍 Testing Error Message Formatting...")
        
        # Test with multiple validation errors
        timestamp = datetime.now().strftime("%H%M%S")
        invalid_data = {
            "email": "invalid-email",  # Invalid email format
            "password": "123",         # Too short password
            "first_name": "",          # Empty first name
            "user_type": "invalid_type"  # Invalid user type
        }
        
        success, response = self.make_request('POST', '/api/auth/register', invalid_data, expected_status=422)
        
        if success:
            error_detail = response.get('detail', '')
            
            # Check if error is a string (formatted) or complex object
            if isinstance(error_detail, str):
                # Check if the error message is readable
                readable = len(error_detail) > 0 and not error_detail.startswith('[{')
                return self.log_test("Error Message Formatting", readable,
                                   f"Error message: {error_detail[:100]}...")
            elif isinstance(error_detail, list):
                # Check if it's a list of readable error messages
                readable_errors = []
                for error in error_detail:
                    if isinstance(error, dict):
                        # Pydantic error format
                        msg = error.get('msg', '')
                        field = error.get('loc', ['unknown'])[-1]
                        readable_errors.append(f"{field}: {msg}")
                    else:
                        readable_errors.append(str(error))
                
                formatted_message = "; ".join(readable_errors)
                return self.log_test("Error Message Formatting", True,
                                   f"Formatted errors: {formatted_message[:100]}...")
            else:
                return self.log_test("Error Message Formatting", False,
                                   f"Error format not readable: {type(error_detail)}")
        else:
            return self.log_test("Error Message Formatting", False,
                               f"Expected 422 status but got: {response}")

    def test_phone_number_field(self):
        """Test that phone number field is properly handled"""
        print("\n🔍 Testing Phone Number Field...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test registration without phone number (should succeed since phone is optional)
        user_data_no_phone = {
            "email": f"nophone_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "No",
            "last_name": "Phone",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_no_phone, expected_status=200)
        no_phone_test = self.log_test("Registration Without Phone", success,
                                    f"Registration successful: {bool(response.get('access_token'))}")
        
        # Test registration with phone number
        user_data_with_phone = {
            "email": f"withphone_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "With",
            "last_name": "Phone",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', user_data_with_phone, expected_status=200)
        with_phone_test = self.log_test("Registration With Phone", success,
                                      f"Registration successful: {bool(response.get('access_token'))}")
        
        return no_phone_test and with_phone_test

    def run_registration_tests(self):
        """Run all registration-focused tests"""
        print("🚀 Starting PetBnB Registration System Tests")
        print("=" * 60)
        
        # Run tests in order focusing on registration validation
        test_methods = [
            self.test_registration_short_password,
            self.test_registration_missing_fields,
            self.test_registration_invalid_email,
            self.test_registration_valid_data,
            self.test_email_verification_token_creation,
            self.test_mobile_app_field_compatibility,
            self.test_error_message_formatting,
            self.test_phone_number_field
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 REGISTRATION TEST SUMMARY")
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
        else:
            print("\n✅ ALL REGISTRATION TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = RegistrationTester()
    success = tester.run_registration_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())