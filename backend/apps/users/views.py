import pyotp
from rest_framework import status, views, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, VIPUpgradeRequestSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core import signing
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.db import transaction
from .models import VIPUpgradeRequest

User = get_user_model()

def generate_verification_token(user, new_email=None):
    email = new_email or user.email
    return signing.dumps({'user_id': user.id, 'email': email})

def verify_verification_token(token, max_age=86400):  # 24 hours
    try:
        data = signing.loads(token, max_age=max_age)
        return data['user_id'], data['email']
    except (signing.SignatureExpired, signing.BadSignature):
        return None, None

def send_welcome_email(user):
    subject = "Welcome to PrimeVolt - Account Created Successfully"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    context = {
        'full_name': str(user.full_name or user.username),
        'username': str(user.username),
    }
    
    try:
        html_content = render_to_string('emails/welcome_email.html', context)
        text_content = strip_tags(html_content)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=recipient_list
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Failed to send welcome email:", str(e))

def send_verification_email(user, token):
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify Your PrimeVolt Account"
    message = (
        f"Hello {user.full_name or user.username},\n\n"
        f"Thank you for registering at PrimeVolt! Please verify your email address by clicking the link below:\n\n"
        f"{verification_link}\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\n"
        f"The PrimeVolt Team"
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def send_verification_email_to_new_address(user, new_email, token):
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify Your New Email - PrimeVolt"
    message = (
        f"Hello {user.full_name or user.username},\n\n"
        f"You requested to update your email address to {new_email} on PrimeVolt.\n"
        f"Please verify this new email address by clicking the link below:\n\n"
        f"{verification_link}\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\n"
        f"The PrimeVolt Team"
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [new_email],
        fail_silently=False,
    )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_email_verified = False
        user.save(update_fields=['is_email_verified'])
        
        try:
            send_welcome_email(user)
        except Exception as e:
            print("Failed to send welcome email:", str(e))
            
        return Response({
            'message': 'Your account has been created successfully. Your account is currently pending administrator verification. Please contact the administrator to complete your account verification.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserMeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from investments.utils import process_matured_investments_for_user
        process_matured_investments_for_user(request.user)
        # Refresh user instance from DB after maturity processing
        request.user.refresh_from_db()
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        new_email = request.data.get('email')
        email_changed = False
        
        if new_email and new_email != user.email:
            email_changed = True
            if User.objects.exclude(id=user.id).filter(email=new_email).exists():
                return Response({'email': ['A user with that email already exists.']}, status=status.HTTP_400_BAD_REQUEST)
            
            token = generate_verification_token(user, new_email=new_email)
            user.is_email_verified = False
            user.save(update_fields=['is_email_verified'])
            
            try:
                send_verification_email_to_new_address(user, new_email, token)
            except Exception as e:
                print("Failed to send email to new address:", str(e))
            
            data = request.data.copy()
            data.pop('email', None)
        else:
            data = request.data
            
        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data = serializer.data
            if email_changed:
                response_data['message'] = 'A verification link has been sent to your new email. Please verify it before logging in again.'
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_referrals(request):
    user = request.user
    from users.models import Referral
    
    referrals = Referral.objects.filter(referrer=user).order_by('-created_at')
    
    history = []
    total_earnings = 0
    for ref in referrals:
        total_earnings += float(ref.bonus_awarded)
        history.append({
            'username': ref.referred.username,
            'email': ref.referred.email,
            'date': ref.created_at.isoformat(),
            'bonus_earned': float(ref.bonus_awarded),
            'status': ref.status
        })

    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.primevolt.online')
    referral_link = f"{frontend_url}/register?ref={user.referral_code}"
    
    return Response({
        'referral_code': user.referral_code,
        'referral_link': referral_link,
        'successful_referrals': referrals.count(),
        'total_earnings': total_earnings,
        'history': history
    })

# Mock/Token Verification Endpoints
@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    token = request.data.get('token') or request.query_params.get('token')
    if not token:
        # Fallback to the old manual code verification if authenticated user provides code
        if request.user.is_authenticated:
            code = request.data.get('code')
            if code == '123456':
                user = request.user
                user.is_email_verified = True
                user.save()
                return Response({'message': 'Email verified successfully.'})
        return Response({'error': 'Verification token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    user_id, email = verify_verification_token(token)
    if not user_id:
        return Response({'error': 'Verification link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(id=user_id)
        user.is_email_verified = True
        if email and user.email != email:
            user.email = email
        user.save()
        return Response({'message': 'Email verified successfully.'})
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def withdraw_user_profit(request):
    user = request.user
    profit = user.profit_balance
    if profit <= 0:
        return Response({'error': 'No accrued daily profit available to withdraw.'}, status=status.HTTP_400_BAD_REQUEST)
    
    from wallets.models import Wallet
    from transactions.models import Transaction
    
    with transaction.atomic():
        wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
        wallet.balance += profit
        wallet.save()
        
        Transaction.objects.create(
            user=user,
            wallet=wallet,
            type='PROFIT',
            amount=profit,
            currency='USDT',
            description="Withdrew daily new account profit",
            status='COMPLETED'
        )
        
        user.profit_balance = 0
        user.save(update_fields=['profit_balance'])
        
    return Response({
        'withdrawn_amount': float(profit),
        'message': f"Successfully withdrew ${profit} USD to your USDT wallet."
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_phone(request):
    code = request.data.get('code')
    if code == '123456':
        user = request.user
        user.is_phone_verified = True
        user.save()
        return Response({'message': 'Phone verified successfully.'})
    return Response({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)

import random
from datetime import timedelta
from django.utils import timezone

# Real Password Reset Flow
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        code = str(random.randint(100000, 999999))
        user.password_reset_otp = code
        user.password_reset_otp_created_at = timezone.now()
        user.save(update_fields=['password_reset_otp', 'password_reset_otp_created_at'])
        
        subject = "Password Reset Code - PrimeVolt"
        message = (
            f"Hello {user.full_name or user.username},\n\n"
            f"You requested a password reset for your PrimeVolt account. "
            f"Please use the following 6-digit verification code to complete the process:\n\n"
            f"Verification Code: {code}\n\n"
            f"This code will expire in 15 minutes.\n\n"
            f"If you did not request this, you can safely ignore this email.\n\n"
            f"Best regards,\n"
            f"The PrimeVolt Team"
        )
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass

    return Response({'message': 'Password reset verification code has been sent to your email.'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('password')
    
    if not email or not code or not new_password:
        return Response({'error': 'Email, code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        
        if not user.password_reset_otp or user.password_reset_otp != code:
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.password_reset_otp_created_at or timezone.now() - user.password_reset_otp_created_at > timedelta(minutes=15):
            return Response({'error': 'Verification code has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.password_reset_otp = None
        user.password_reset_otp_created_at = None
        user.save(update_fields=['password', 'password_reset_otp', 'password_reset_otp_created_at'])
        
        return Response({'message': 'Password reset successfully. You can now login with your new password.'})
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

# 2FA Endpoints
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enable_2fa(request):
    user = request.user
    if not user.otp_secret:
        user.otp_secret = pyotp.random_base32()
        user.save()
    totp = pyotp.TOTP(user.otp_secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="PrimeVolt")
    return Response({
        'secret': user.otp_secret,
        'provisioning_uri': provisioning_uri
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_2fa(request):
    user = request.user
    code = request.data.get('code')
    if not user.otp_secret:
        return Response({'error': '2FA is not enabled or set up yet.'}, status=status.HTTP_400_BAD_REQUEST)
    totp = pyotp.TOTP(user.otp_secret)
    if totp.verify(code):
        user.is_2fa_enabled = True
        user.save()
        return Response({'message': '2FA verified and enabled successfully.'})
    return Response({'error': 'Invalid 2FA code.'}, status=status.HTTP_400_BAD_REQUEST)

class VIPUpgradeViewSet(viewsets.ModelViewSet):
    serializer_class = VIPUpgradeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VIPUpgradeRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, amount=200.0, status='PENDING')


import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = settings.CLOUDINARY_CLOUD_NAME,
    api_key = settings.CLOUDINARY_API_KEY,
    api_secret = settings.CLOUDINARY_API_SECRET
)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_profile_picture(request):
    file_to_upload = request.FILES.get('profile_picture')
    if not file_to_upload:
        return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        upload_result = cloudinary.uploader.upload(file_to_upload, folder="profile_pictures")
        profile_picture_url = upload_result.get('secure_url')
        
        user = request.user
        user.profile_picture = profile_picture_url
        user.save(update_fields=['profile_picture'])
        
        return Response({'profile_picture': profile_picture_url})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


