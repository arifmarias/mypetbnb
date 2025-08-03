#!/usr/bin/env python3
"""
Mobile App Authentication Compatibility Testing
Testing mobile app authentication integration after fixing compatibility issues
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class MobileAuthTester:
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
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
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

    def test_demo_account_login_mobile_format(self):
        """Test demo account login with mobile app expected response format"""
        print("\n🔍 Testing Demo Account Login - Mobile App Format...")
        
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
            
            if success:
                # Check mobile app expected response format
                required_fields = ['access_token', 'token_type', 'user_id']
                has_required_fields = all(field in response for field in required_fields)
                
                # Check token format (JWT should have 3 parts)
                token_valid_format = False
                if 'access_token' in response:
                    token_parts = response['access_token'].split('.')
                    token_valid_format = len(token_parts) == 3
                
                # Check token_type is "bearer"
                token_type_correct = response.get('token_type') == 'bearer'
                
                if has_required_fields and token_valid_format and token_type_correct:
                    login_results.append(self.log_test(f"Mobile Login Format ({account['role']})", True, 
                                                     f"✅ All required fields present, JWT format valid"))
                    
                    # Store token for further testing
                    if account["role"] == "pet_owner":
                        self.pet_owner_token = response['access_token']
                        self.pet_owner_id = response['user_id']
                    else:
                        self.caregiver_token = response['access_token']
                        self.caregiver_id = response['user_id']
                else:
                    missing_fields = [field for field in required_fields if field not in response]
                    login_results.append(self.log_test(f"Mobile Login Format ({account['role']})", False, 
                                                     f"❌ Missing fields: {missing_fields}, Token format valid: {token_valid_format}"))
            else:
                error_detail = response.get('detail', str(response))
                login_results.append(self.log_test(f"Mobile Login Format ({account['role']})", False, 
                                                 f"❌ Login failed: {error_detail}"))
        
        return all(login_results)

    def test_auth_me_mobile_format(self):
        """Test /api/auth/me returns user data in mobile app expected format"""
        print("\n🔍 Testing /api/auth/me - Mobile App Format...")
        
        if not hasattr(self, 'pet_owner_token') or not self.pet_owner_token:
            return self.log_test("Auth Me Mobile Format", False, "❌ No pet owner token available")
        
        success, response = self.make_request('GET', '/api/auth/me', token=self.pet_owner_token, expected_status=200)
        
        if success:
            # Check mobile app expected user data format
            required_fields = ['id', 'first_name', 'last_name', 'email', 'user_type', 'email_verified']
            has_required_fields = all(field in response for field in required_fields)
            
            # Check that first_name and last_name are separate (not full_name)
            has_separate_names = 'first_name' in response and 'last_name' in response and 'full_name' not in response
            
            # Check field types
            field_types_correct = (
                isinstance(response.get('first_name'), str) and
                isinstance(response.get('last_name'), str) and
                isinstance(response.get('email'), str) and
                isinstance(response.get('user_type'), str) and
                isinstance(response.get('email_verified'), bool)
            )
            
            if has_required_fields and has_separate_names and field_types_correct:
                return self.log_test("Auth Me Mobile Format", True, 
                                   f"✅ All required fields present: {response.get('first_name')} {response.get('last_name')}, {response.get('user_type')}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                return self.log_test("Auth Me Mobile Format", False, 
                                   f"❌ Issues: Missing fields: {missing_fields}, Separate names: {has_separate_names}, Types correct: {field_types_correct}")
        else:
            error_detail = response.get('detail', str(response))
            return self.log_test("Auth Me Mobile Format", False, f"❌ Request failed: {error_detail}")

    def test_registration_mobile_format(self):
        """Test registration endpoint with mobile app data format"""
        print("\n🔍 Testing Registration - Mobile App Format...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test mobile app registration data format
        mobile_registration_data = {
            "email": f"mobile_test_{timestamp}@test.com",
            "password": "TestPassword123!",
            "first_name": "Mobile",
            "last_name": "User",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', mobile_registration_data, expected_status=200)
        
        if success:
            # Check response format matches mobile app expectations
            required_fields = ['access_token', 'token_type', 'user_id']
            has_required_fields = all(field in response for field in required_fields)
            
            # Check token format
            token_valid_format = False
            if 'access_token' in response:
                token_parts = response['access_token'].split('.')
                token_valid_format = len(token_parts) == 3
            
            # Test immediate token usage
            if 'access_token' in response:
                token_success, user_data = self.make_request('GET', '/api/auth/me', token=response['access_token'], expected_status=200)
                
                if token_success:
                    # Verify user was created with correct field names
                    user_has_correct_fields = (
                        user_data.get('first_name') == 'Mobile' and
                        user_data.get('last_name') == 'User' and
                        user_data.get('user_type') == 'pet_owner'
                    )
                    
                    if has_required_fields and token_valid_format and user_has_correct_fields:
                        return self.log_test("Registration Mobile Format", True, 
                                           f"✅ Registration successful, user created with correct fields")
                    else:
                        return self.log_test("Registration Mobile Format", False, 
                                           f"❌ Issues: Required fields: {has_required_fields}, Token format: {token_valid_format}, User fields: {user_has_correct_fields}")
                else:
                    return self.log_test("Registration Mobile Format", False, 
                                       f"❌ Token not immediately usable: {user_data.get('detail', 'Unknown error')}")
            else:
                return self.log_test("Registration Mobile Format", False, "❌ No access token in response")
        else:
            error_detail = response.get('detail', str(response))
            return self.log_test("Registration Mobile Format", False, f"❌ Registration failed: {error_detail}")

    def test_caregiver_registration_mobile_format(self):
        """Test caregiver registration with mobile app data format"""
        print("\n🔍 Testing Caregiver Registration - Mobile App Format...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test mobile app caregiver registration data format
        mobile_caregiver_data = {
            "email": f"mobile_caregiver_{timestamp}@test.com",
            "password": "TestPassword123!",
            "first_name": "Mobile",
            "last_name": "Caregiver",
            "phone": "+65 9876 5432",
            "user_type": "caregiver"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', mobile_caregiver_data, expected_status=200)
        
        if success:
            # Check response format
            required_fields = ['access_token', 'token_type', 'user_id']
            has_required_fields = all(field in response for field in required_fields)
            
            # Test immediate token usage and verify caregiver profile creation
            if 'access_token' in response:
                token_success, user_data = self.make_request('GET', '/api/auth/me', token=response['access_token'], expected_status=200)
                
                if token_success:
                    # Verify caregiver was created with correct fields
                    caregiver_correct = (
                        user_data.get('first_name') == 'Mobile' and
                        user_data.get('last_name') == 'Caregiver' and
                        user_data.get('user_type') == 'caregiver'
                    )
                    
                    if has_required_fields and caregiver_correct:
                        return self.log_test("Caregiver Registration Mobile Format", True, 
                                           f"✅ Caregiver registration successful with correct fields")
                    else:
                        return self.log_test("Caregiver Registration Mobile Format", False, 
                                           f"❌ Issues: Required fields: {has_required_fields}, Caregiver fields: {caregiver_correct}")
                else:
                    return self.log_test("Caregiver Registration Mobile Format", False, 
                                       f"❌ Token not immediately usable: {user_data.get('detail', 'Unknown error')}")
            else:
                return self.log_test("Caregiver Registration Mobile Format", False, "❌ No access token in response")
        else:
            error_detail = response.get('detail', str(response))
            return self.log_test("Caregiver Registration Mobile Format", False, f"❌ Registration failed: {error_detail}")

    def test_verification_email_integration(self):
        """Test that verification email is sent during registration"""
        print("\n🔍 Testing Verification Email Integration...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Register a new user
        registration_data = {
            "email": f"verification_test_{timestamp}@test.com",
            "password": "TestPassword123!",
            "first_name": "Verification",
            "last_name": "Test",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', registration_data, expected_status=200)
        
        if success and 'access_token' in response:
            # Check verification status
            token = response['access_token']
            status_success, status_response = self.make_request('GET', '/api/auth/verification-status', 
                                                              token=token, expected_status=200)
            
            if status_success:
                verification_status = status_response.get('verification_status', {})
                has_verification_data = 'email_verified' in verification_status
                
                # Test resend verification (should work even if SMTP fails)
                resend_success, resend_response = self.make_request('POST', '/api/auth/resend-verification', 
                                                                  token=token, expected_status=200)
                
                if has_verification_data and resend_success:
                    return self.log_test("Verification Email Integration", True, 
                                       f"✅ Verification system integrated, email_verified: {verification_status.get('email_verified', 'N/A')}")
                else:
                    return self.log_test("Verification Email Integration", False, 
                                       f"❌ Issues: Verification data: {has_verification_data}, Resend: {resend_success}")
            else:
                return self.log_test("Verification Email Integration", False, 
                                   f"❌ Cannot check verification status: {status_response.get('detail', 'Unknown error')}")
        else:
            error_detail = response.get('detail', str(response))
            return self.log_test("Verification Email Integration", False, f"❌ Registration failed: {error_detail}")

    def test_mobile_app_field_compatibility(self):
        """Test that mobile app gets data in expected field format (no full_name split issues)"""
        print("\n🔍 Testing Mobile App Field Compatibility...")
        
        if not hasattr(self, 'pet_owner_token') or not self.pet_owner_token:
            return self.log_test("Mobile Field Compatibility", False, "❌ No pet owner token available")
        
        success, response = self.make_request('GET', '/api/auth/me', token=self.pet_owner_token, expected_status=200)
        
        if success:
            # Check that we have first_name and last_name (not full_name)
            has_first_name = 'first_name' in response and response['first_name']
            has_last_name = 'last_name' in response and response['last_name']
            no_full_name = 'full_name' not in response
            
            # Check that names are strings (not None or empty)
            first_name_valid = isinstance(response.get('first_name'), str) and len(response.get('first_name', '')) > 0
            last_name_valid = isinstance(response.get('last_name'), str) and len(response.get('last_name', '')) > 0
            
            if has_first_name and has_last_name and no_full_name and first_name_valid and last_name_valid:
                return self.log_test("Mobile Field Compatibility", True, 
                                   f"✅ Correct field format: first_name='{response.get('first_name')}', last_name='{response.get('last_name')}'")
            else:
                issues = []
                if not has_first_name: issues.append("missing first_name")
                if not has_last_name: issues.append("missing last_name")
                if not no_full_name: issues.append("has full_name field")
                if not first_name_valid: issues.append("invalid first_name")
                if not last_name_valid: issues.append("invalid last_name")
                
                return self.log_test("Mobile Field Compatibility", False, f"❌ Issues: {', '.join(issues)}")
        else:
            error_detail = response.get('detail', str(response))
            return self.log_test("Mobile Field Compatibility", False, f"❌ Request failed: {error_detail}")

    def test_token_persistence_and_validation(self):
        """Test that tokens work consistently and contain required fields"""
        print("\n🔍 Testing Token Persistence and Validation...")
        
        if not hasattr(self, 'pet_owner_token') or not self.pet_owner_token:
            return self.log_test("Token Persistence", False, "❌ No pet owner token available")
        
        # Test multiple requests with same token
        test_results = []
        
        for i in range(3):
            success, response = self.make_request('GET', '/api/auth/me', token=self.pet_owner_token, expected_status=200)
            
            if success:
                # Check consistent response
                has_required_fields = all(field in response for field in ['id', 'first_name', 'last_name', 'email', 'user_type'])
                test_results.append(has_required_fields)
            else:
                test_results.append(False)
        
        all_requests_successful = all(test_results)
        
        if all_requests_successful:
            return self.log_test("Token Persistence", True, "✅ Token works consistently across multiple requests")
        else:
            failed_requests = len([r for r in test_results if not r])
            return self.log_test("Token Persistence", False, f"❌ {failed_requests}/3 requests failed")

    def run_mobile_auth_tests(self):
        """Run all mobile app authentication compatibility tests"""
        print("📱 Starting Mobile App Authentication Compatibility Tests")
        print("=" * 70)
        
        # Initialize tokens
        self.pet_owner_token = None
        self.caregiver_token = None
        self.pet_owner_id = None
        self.caregiver_id = None
        
        # Run tests in order
        test_methods = [
            self.test_demo_account_login_mobile_format,
            self.test_auth_me_mobile_format,
            self.test_registration_mobile_format,
            self.test_caregiver_registration_mobile_format,
            self.test_verification_email_integration,
            self.test_mobile_app_field_compatibility,
            self.test_token_persistence_and_validation
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 MOBILE APP AUTHENTICATION TEST SUMMARY")
        print("=" * 70)
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
            print("\n🎉 ALL MOBILE APP AUTHENTICATION TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MobileAuthTester()
    success = tester.run_mobile_auth_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())