"""
Backend API tests for PMI-PMO CP Exam Preparation App
Tests: Auth, Course modules/lessons, Exams, Payment, Certificate
"""
import pytest
import requests
import os

# Get backend URL from frontend .env or use default
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=')[1].strip().rstrip('/')
                break
except:
    BASE_URL = "https://quick-video-academy.preview.emergentagent.com"

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self):
        """Test user registration"""
        import time
        unique_email = f"TEST_newuser_{int(time.time())}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["name"] == "Test User"
        assert data["user"]["is_paid"] == False
        
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "admin@pmhouse.com",
            "password": "testpass123",
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@pmhouse.com"
        assert data["user"]["role"] == "admin"
        assert data["user"]["is_paid"] == True
        
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
    def test_get_me_with_token(self):
        """Test /api/auth/me with valid token"""
        # Login first
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "admin@pmhouse.com"
        
    def test_get_me_without_token(self):
        """Test /api/auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestCourse:
    """Course modules and lessons tests"""
    
    def test_get_modules_without_auth(self):
        """Test GET /api/course/modules without auth"""
        response = requests.get(f"{BASE_URL}/api/course/modules")
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        assert len(data["modules"]) == 6
        # Check first module
        mod1 = data["modules"][0]
        assert mod1["id"] == "mod1"
        assert "lesson_count" in mod1
        assert "demo_lessons" in mod1
        
    def test_get_modules_with_auth(self):
        """Test GET /api/course/modules with auth"""
        # Login first
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/course/modules", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["modules"]) == 6
        
    def test_get_module_lessons(self):
        """Test GET /api/course/modules/{module_id}/lessons"""
        response = requests.get(f"{BASE_URL}/api/course/modules/mod1/lessons")
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert len(data["lessons"]) > 0
        # Check first lesson is demo
        lesson1 = data["lessons"][0]
        assert lesson1["id"] == "L1_1"
        assert lesson1["is_demo"] == True
        assert lesson1["is_accessible"] == True
        
    def test_get_demo_lesson_without_auth(self):
        """Test GET /api/course/lessons/{lesson_id} for demo lesson without auth"""
        response = requests.get(f"{BASE_URL}/api/course/lessons/L1_1")
        assert response.status_code == 200
        data = response.json()
        assert "lesson" in data
        assert data["lesson"]["id"] == "L1_1"
        assert data["lesson"]["is_demo"] == True
        assert "slides" in data["lesson"]
        assert len(data["lesson"]["slides"]) > 0
        
    def test_get_non_demo_lesson_without_auth(self):
        """Test GET /api/course/lessons/{lesson_id} for non-demo lesson without auth"""
        response = requests.get(f"{BASE_URL}/api/course/lessons/L1_2")
        assert response.status_code == 403
        
    def test_get_non_demo_lesson_with_paid_user(self):
        """Test GET /api/course/lessons/{lesson_id} for non-demo lesson with paid user"""
        # Login as admin (paid user)
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/course/lessons/L1_2", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["lesson"]["id"] == "L1_2"
        assert data["lesson"]["is_demo"] == False


class TestExams:
    """Exam endpoints tests"""
    
    def test_get_exams_without_auth(self):
        """Test GET /api/exams without auth"""
        response = requests.get(f"{BASE_URL}/api/exams")
        assert response.status_code == 200
        data = response.json()
        assert "exams" in data
        assert len(data["exams"]) == 2
        # Check exams are not accessible
        for exam in data["exams"]:
            assert exam["is_accessible"] == False
            
    def test_get_exams_with_paid_user(self):
        """Test GET /api/exams with paid user"""
        # Login as admin (paid user)
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/exams", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["exams"]) == 2
        # Check exams are accessible for paid user
        for exam in data["exams"]:
            assert exam["is_accessible"] == True
            
    def test_get_exam_detail_without_payment(self):
        """Test GET /api/exams/{exam_id} without payment"""
        # Register new user
        import time
        unique_email = f"TEST_freeuser_{int(time.time())}@example.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Free User"
        })
        token = reg_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/exams/exam1", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        
    def test_get_exam_detail_with_payment(self):
        """Test GET /api/exams/{exam_id} with paid user"""
        # Login as admin (paid user)
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/exams/exam1", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "exam" in data
        assert "questions" in data
        assert data["exam"]["id"] == "exam1"
        assert len(data["questions"]) == 20


class TestPayment:
    """Payment endpoints tests"""
    
    def test_get_payment_link(self):
        """Test GET /api/payment/link"""
        response = requests.get(f"{BASE_URL}/api/payment/link")
        assert response.status_code == 200
        data = response.json()
        assert "paypal_link" in data
        assert "paypal.com" in data["paypal_link"]
        
    def test_confirm_payment(self):
        """Test POST /api/payment/confirm"""
        # Register new user
        import time
        unique_email = f"TEST_paymentuser_{int(time.time())}@example.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Payment User"
        })
        token = reg_res.json()["access_token"]
        
        # Confirm payment
        response = requests.post(f"{BASE_URL}/api/payment/confirm", 
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"transaction_id": "test_transaction_123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["is_paid"] == True
        
        # Verify user is now paid
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_res.json()["user"]["is_paid"] == True


class TestCertificate:
    """Certificate endpoint tests"""
    
    def test_get_certificate_incomplete_course(self):
        """Test GET /api/certificate with incomplete course"""
        # Register new user
        import time
        unique_email = f"TEST_certuser_{int(time.time())}@example.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Cert User"
        })
        token = reg_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/certificate", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "غير مكتملة" in data["detail"]


class TestProgress:
    """Progress tracking tests"""
    
    def test_get_progress(self):
        """Test GET /api/progress"""
        # Login as admin
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pmhouse.com",
            "password": "PMHouse@2024"
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/progress", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_lessons" in data
        assert "completed_lessons" in data
        assert "progress_percentage" in data
        assert data["total_lessons"] == 24  # 6 modules x 4 lessons each
