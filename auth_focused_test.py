#!/usr/bin/env python3
"""
Authentication-focused test for PetBnB Backend API
Testing the specific fixes mentioned in the review request
"""

import requests
import json
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url: str = "https://387c6cb1-495f-4442-86a9-09b27c6e460e.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        self.test_results = []
        self.tokens = {}

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
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

    def make_request(self, method: str, endpoint: str, data=None, token=None, expected_status=200):
        """Make HTTP request"""
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

    def test_demo_account_login_detailed(self):
        """Test demo accounts with TestPassword123! as specified in review request"""
        print("\n🔐 Testing Demo Account Login (Review Request Focus)")
        print("-" * 50)
        
        demo_accounts = [
            {"email": "john.petowner@demo.com", "password": "TestPassword123!", "role": "pet_owner"},
            {"email": "sarah.caregiver@demo.com", "password": "TestPassword123!", "role": "caregiver"}
        ]
        
        all_success = True
        
        for account in demo_accounts:
            login_data = {
                "email": account["email"],
                "password": account["password"]
            }
            
            success, response = self.make_request('POST', '/api/auth/login', login_data, expected_status=200)
            
            if success and 'access_token' in response:
                token = response['access_token']
                user_id = response.get('user_id')
                
                # Store token for further testing
                self.tokens[account['role']] = {
                    'token': token,
                    'user_id': user_id,
                    'email': account['email']
                }
                
                # Verify token structure (JWT should have 3 parts)
                token_parts = token.split('.')
                structure_valid = len(token_parts) == 3
                
                result = self.log_result(
                    f"Demo Login - {account['role']}",
                    True,
                    f"✓ Token received ✓ JWT structure valid ({len(token_parts)} parts) ✓ User ID: {user_id}"
                )
                all_success = all_success and result
                
            else:
                error_detail = response.get('detail', str(response))
                result = self.log_result(
                    f"Demo Login - {account['role']}",
                    False,
                    f"Failed: {error_detail}"
                )
                all_success = False
        
        return all_success

    def test_jwt_token_validation_detailed(self):
        """Test JWT token validation with /api/auth/me endpoint"""
        print("\n🔐 Testing JWT Token Validation")
        print("-" * 50)
        
        all_success = True
        
        for role, token_data in self.tokens.items():
            token = token_data['token']
            email = token_data['email']
            
            # Test valid token
            success, response = self.make_request('GET', '/api/auth/me', token=token, expected_status=200)
            
            if success:
                user_email = response.get('email')
                user_type = response.get('user_type')
                user_id = response.get('id')
                
                # Verify token contains expected fields
                fields_valid = all([
                    user_email == email,
                    user_type == role,
                    user_id is not None
                ])
                
                result = self.log_result(
                    f"Token Validation - {role}",
                    fields_valid,
                    f"✓ Email: {user_email} ✓ Role: {user_type} ✓ ID: {user_id}"
                )
                all_success = all_success and result
                
            else:
                error_detail = response.get('detail', str(response))
                result = self.log_result(
                    f"Token Validation - {role}",
                    False,
                    f"Failed: {error_detail}"
                )
                all_success = False
        
        return all_success

    def test_new_user_registration(self):
        """Test new user registration and immediate token usage"""
        print("\n🔐 Testing New User Registration")
        print("-" * 50)
        
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Test pet owner registration
        pet_owner_data = {
            "email": f"newuser_{timestamp}@test.com",
            "password": "TestPassword123!",
            "first_name": "New",
            "last_name": "User",
            "phone": "+65 9123 4567",
            "user_type": "pet_owner"
        }
        
        success, response = self.make_request('POST', '/api/auth/register', pet_owner_data, expected_status=200)
        
        if success and 'access_token' in response:
            token = response['access_token']
            user_id = response.get('user_id')
            
            # Test immediate token usage
            success_immediate, user_response = self.make_request('GET', '/api/auth/me', token=token, expected_status=200)
            
            if success_immediate:
                result = self.log_result(
                    "New User Registration",
                    True,
                    f"✓ Registration successful ✓ Token works immediately ✓ User ID: {user_id}"
                )
            else:
                result = self.log_result(
                    "New User Registration",
                    False,
                    f"Registration successful but token failed: {user_response.get('detail', 'Unknown error')}"
                )
        else:
            error_detail = response.get('detail', str(response))
            result = self.log_result(
                "New User Registration",
                False,
                f"Registration failed: {error_detail}"
            )
        
        return result

    def test_protected_endpoints(self):
        """Test protected endpoints with valid tokens"""
        print("\n🔐 Testing Protected Endpoints")
        print("-" * 50)
        
        if not self.tokens:
            return self.log_result("Protected Endpoints", False, "No tokens available for testing")
        
        # Test various protected endpoints
        protected_tests = [
            ('/api/auth/me', 'GET', 'pet_owner', 200),
            ('/api/pets', 'GET', 'pet_owner', 200),
            ('/api/caregiver/services', 'GET', 'caregiver', 200),
            ('/api/bookings', 'GET', 'pet_owner', 200),
        ]
        
        all_success = True
        
        for endpoint, method, required_role, expected_status in protected_tests:
            if required_role in self.tokens:
                token = self.tokens[required_role]['token']
                success, response = self.make_request(method, endpoint, token=token, expected_status=expected_status)
                
                status_code = response.get('status_code', 'N/A') if isinstance(response, dict) else 'N/A'
                result = self.log_result(
                    f"Protected Endpoint - {endpoint}",
                    success,
                    f"Role: {required_role}, Status: {status_code}"
                )
                all_success = all_success and result
            else:
                result = self.log_result(
                    f"Protected Endpoint - {endpoint}",
                    False,
                    f"No {required_role} token available"
                )
                all_success = False
        
        return all_success

    def test_token_rejection(self):
        """Test invalid token rejection"""
        print("\n🔐 Testing Token Rejection")
        print("-" * 50)
        
        # Test with invalid token
        success, response = self.make_request('GET', '/api/auth/me', token="invalid_token_123", expected_status=401)
        invalid_test = self.log_result(
            "Invalid Token Rejection",
            success,
            f"Correctly rejected with: {response.get('detail', 'N/A')}"
        )
        
        # Test with no token
        success, response = self.make_request('GET', '/api/auth/me', expected_status=403)
        no_token_test = self.log_result(
            "No Token Rejection",
            success,
            f"Correctly rejected with: {response.get('detail', 'N/A')}"
        )
        
        return invalid_test and no_token_test

    def run_authentication_tests(self):
        """Run all authentication-focused tests"""
        print("🚀 PetBnB Authentication System Testing")
        print("Focus: Demo accounts, JWT validation, new registration, protected endpoints")
        print("=" * 70)
        
        # Run tests in order
        test_methods = [
            self.test_demo_account_login_detailed,
            self.test_jwt_token_validation_detailed,
            self.test_new_user_registration,
            self.test_protected_endpoints,
            self.test_token_rejection
        ]
        
        all_passed = True
        for test_method in test_methods:
            try:
                result = test_method()
                all_passed = all_passed and result
            except Exception as e:
                self.log_result(test_method.__name__, False, f"Exception: {str(e)}")
                all_passed = False
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 AUTHENTICATION TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        else:
            print("\n🎉 ALL AUTHENTICATION TESTS PASSED!")
        
        return all_passed

def main():
    """Main test execution"""
    tester = AuthenticationTester()
    success = tester.run_authentication_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())