from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
# Emergent integrations - optional for demo
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    import stripe as stripe_lib
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'demo-key')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_demo')

security = HTTPBearer()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    user_type: str  # "influencer" or "brand"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    user_type: str = Field(..., pattern="^(influencer|brand)$")

    @staticmethod
    def validate_password(password: str) -> str:
        """Validate password meets security requirements"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one digit")
        return password

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class InfluencerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    bio: str = ""
    niche_tags: List[str] = []
    social_profiles: Dict[str, Any] = {}  # {"instagram": {...}, "tiktok": {...}}
    follower_count: int = 0
    engagement_rate: float = 0.0
    pricing: float = 0.0
    portfolio: List[str] = []

class BrandProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    company_name: str = ""
    description: str = ""
    industry: str = ""
    collaboration_history: List[str] = []

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str
    title: str
    description: str
    budget: float
    target_audience: str = ""
    niche_tags: List[str] = []
    status: str = "active"  # active, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    budget: float = Field(..., gt=0, le=1000000)
    target_audience: str = Field(default="", max_length=1000)
    niche_tags: List[str] = Field(default=[], max_items=10)

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    influencer_id: str
    campaign_id: str
    match_score: int
    ai_explanation: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    influencer_id: str
    campaign_id: str
    status: str = "pending"  # pending, accepted, rejected
    message: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ApplicationCreate(BaseModel):
    campaign_id: str
    message: str = Field(default="", max_length=2000)

class ApplicationStatusUpdate(BaseModel):
    status: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    campaign_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    receiver_id: str
    campaign_id: str
    content: str = Field(..., min_length=1, max_length=5000)

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    influencer_id: str
    brand_id: str
    amount: float
    status: str = "pending"  # pending, completed, failed
    milestone_description: str = ""
    stripe_session_id: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentRequest(BaseModel):
    campaign_id: str
    influencer_id: str
    milestone_description: str = ""

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_reset_token(email: str) -> str:
    """Create a password reset token (valid for 1 hour)"""
    payload = {
        "email": email,
        "purpose": "password_reset",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def send_password_reset_email(email: str, token: str):
    """Send password reset email (placeholder - configure SMTP in .env)"""
    # In production, this would send an actual email
    # For now, we'll just log the reset link
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    logger.info(f"Password reset requested for {email}")
    logger.info(f"Reset link (in production, this would be emailed): {reset_link}")
    # TODO: Implement actual email sending when SMTP is configured
    # import smtplib
    # from email.mime.text import MIMEText
    # ...

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ MOCK DATA GENERATOR ============

async def generate_mock_data():
    """Generate mock influencer profiles and campaigns"""
    # Check if data already exists
    existing_influencers = await db.influencer_profiles.count_documents({})
    if existing_influencers > 0:
        return

    # Mock influencers
    mock_influencers = [
        {
            "user_id": f"mock_inf_{i}",
            "bio": f"Passionate content creator in {niche}",
            "niche_tags": [niche, "lifestyle", "content"],
            "social_profiles": {
                "instagram": {"username": f"@{niche}_creator{i}", "followers": followers},
                "tiktok": {"username": f"@{niche}_tiktoker{i}", "followers": followers * 0.8},
                "youtube": {"username": f"{niche}_channel{i}", "subscribers": followers * 0.5}
            },
            "follower_count": followers,
            "engagement_rate": engagement,
            "pricing": pricing,
            "portfolio": [f"Campaign with Brand {j}" for j in range(1, 4)]
        }
        for i, (niche, followers, engagement, pricing) in enumerate([
            ("fashion", 150000, 4.5, 2500.0),
            ("tech", 300000, 5.2, 5000.0),
            ("fitness", 200000, 6.1, 3500.0),
            ("beauty", 180000, 5.8, 3000.0),
            ("travel", 250000, 4.9, 4000.0),
            ("food", 120000, 5.5, 2000.0),
            ("gaming", 500000, 7.2, 7500.0),
            ("education", 100000, 4.2, 1500.0),
            ("music", 350000, 6.5, 6000.0),
            ("sports", 220000, 5.0, 3800.0)
        ], 1)
    ]

    await db.influencer_profiles.insert_many(mock_influencers)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
@limiter.limit("5/hour")  # Prevent spam registrations
async def register(request: Request, user_data: UserRegister):
    # Validate password
    try:
        UserRegister.validate_password(user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=user_data.email,
        user_type=user_data.user_type
    )
    user_doc = user.model_dump()
    user_doc["password_hash"] = hash_password(user_data.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()

    await db.users.insert_one(user_doc)
    logger.info(f"New user registered: {user.email} ({user.user_type})")

    # Create profile based on user type
    if user_data.user_type == "influencer":
        profile = InfluencerProfile(user_id=user.id)
        await db.influencer_profiles.insert_one(profile.model_dump())
    else:
        profile = BrandProfile(user_id=user.id)
        await db.brand_profiles.insert_one(profile.model_dump())

    token = create_token(user.id)
    return {"token": token, "user": user}

@api_router.post("/auth/login")
@limiter.limit("10/minute")  # Prevent brute force attacks
async def login(request: Request, credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"])
    user.pop("password_hash")
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    # Get profile
    if current_user["user_type"] == "influencer":
        profile = await db.influencer_profiles.find_one({"user_id": current_user["id"]}, {"_id": 0})
    else:
        profile = await db.brand_profiles.find_one({"user_id": current_user["id"]}, {"_id": 0})

    return {**current_user, "profile": profile}

@api_router.post("/auth/request-password-reset")
@limiter.limit("3/hour")  # Prevent abuse
async def request_password_reset(request: Request, reset_request: PasswordResetRequest):
    """Request a password reset token"""
    user = await db.users.find_one({"email": reset_request.email}, {"_id": 0})

    # Always return success to prevent email enumeration
    if user:
        token = create_reset_token(reset_request.email)
        await send_password_reset_email(reset_request.email, token)

    return {"message": "If the email exists, a password reset link has been sent"}

@api_router.post("/auth/reset-password")
@limiter.limit("5/hour")
async def reset_password(request: Request, reset_data: PasswordReset):
    """Reset password using token"""
    try:
        # Validate password requirements
        UserRegister.validate_password(reset_data.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Decode and validate token
        payload = jwt.decode(reset_data.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        purpose = payload.get("purpose")

        if purpose != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token")

        # Update password
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(reset_data.new_password)}}
        )

        logger.info(f"Password reset successful for user: {email}")
        return {"message": "Password reset successful"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

# ============ INFLUENCER ROUTES ============

@api_router.get("/influencers")
async def get_influencers(
    niche: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    min_followers: Optional[int] = None,
    max_followers: Optional[int] = None
):
    """Get influencers with pagination and filtering"""
    query = {}
    if niche:
        query["niche_tags"] = {"$in": [niche]}

    if min_followers is not None:
        query["follower_count"] = {"$gte": min_followers}

    if max_followers is not None:
        if "follower_count" in query:
            query["follower_count"]["$lte"] = max_followers
        else:
            query["follower_count"] = {"$lte": max_followers}

    # Limit to max 100 per request
    limit = min(limit, 100)

    influencers = await db.influencer_profiles.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.influencer_profiles.count_documents(query)

    return {
        "data": influencers,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + len(influencers)) < total
    }

@api_router.get("/influencers/{influencer_id}")
async def get_influencer(influencer_id: str):
    profile = await db.influencer_profiles.find_one({"user_id": influencer_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return profile

@api_router.put("/influencers/profile")
async def update_influencer_profile(profile_data: InfluencerProfile, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "influencer":
        raise HTTPException(status_code=403, detail="Only influencers can update influencer profiles")

    profile_data.user_id = current_user["id"]
    await db.influencer_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": profile_data.model_dump()},
        upsert=True
    )
    return profile_data

# ============ BRAND ROUTES ============

@api_router.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    profile = await db.brand_profiles.find_one({"user_id": brand_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand not found")
    return profile

@api_router.put("/brands/profile")
async def update_brand_profile(profile_data: BrandProfile, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "brand":
        raise HTTPException(status_code=403, detail="Only brands can update brand profiles")

    profile_data.user_id = current_user["id"]
    await db.brand_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": profile_data.model_dump()},
        upsert=True
    )
    return profile_data

# ============ CAMPAIGN ROUTES ============

@api_router.post("/campaigns")
async def create_campaign(campaign_data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "brand":
        raise HTTPException(status_code=403, detail="Only brands can create campaigns")

    campaign = Campaign(
        brand_id=current_user["id"],
        **campaign_data.model_dump()
    )
    campaign_doc = campaign.model_dump()
    campaign_doc["created_at"] = campaign_doc["created_at"].isoformat()

    await db.campaigns.insert_one(campaign_doc)
    return campaign

@api_router.get("/campaigns")
async def get_campaigns(
    status: Optional[str] = None,
    niche: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None
):
    """Get campaigns with pagination and filtering"""
    query = {}
    if status:
        query["status"] = status
    if niche:
        query["niche_tags"] = {"$in": [niche]}

    if min_budget is not None:
        query["budget"] = {"$gte": min_budget}

    if max_budget is not None:
        if "budget" in query:
            query["budget"]["$lte"] = max_budget
        else:
            query["budget"] = {"$lte": max_budget}

    # Limit to max 100 per request
    limit = min(limit, 100)

    campaigns = await db.campaigns.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.campaigns.count_documents(query)

    return {
        "data": campaigns,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + len(campaigns)) < total
    }

@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, campaign_data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign["brand_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": campaign_data.model_dump()}
    )
    return {**campaign, **campaign_data.model_dump()}

@api_router.get("/campaigns/{campaign_id}/applications")
async def get_campaign_applications(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign["brand_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    applications = await db.applications.find({"campaign_id": campaign_id}, {"_id": 0}).to_list(100)
    return applications

# ============ MATCHMAKING ROUTES ============

def calculate_match_score(influencer_niches: List[str], campaign_niches: List[str],
                         influencer_followers: int, campaign_budget: float,
                         influencer_engagement: float, influencer_pricing: float) -> tuple:
    """Fallback match scoring when AI is not available"""
    # Niche overlap score (0-50 points)
    common_niches = set(influencer_niches) & set(campaign_niches)
    niche_score = min(len(common_niches) * 25, 50)

    # Budget alignment (0-30 points)
    budget_ratio = min(campaign_budget / max(influencer_pricing, 1), 3)
    budget_score = min(budget_ratio * 10, 30)

    # Engagement quality (0-20 points)
    engagement_score = min(influencer_engagement * 3, 20)

    total_score = int(niche_score + budget_score + engagement_score)

    explanation = f"Match based on {len(common_niches)} shared niche(s)"
    if budget_ratio >= 1:
        explanation += f", budget alignment (${campaign_budget:,.0f})"
    if influencer_engagement > 5:
        explanation += f", strong engagement ({influencer_engagement:.1f}%)"

    return total_score, explanation

@api_router.post("/matches/generate")
@limiter.limit("5/hour")  # Limit to 5 match generations per hour
async def generate_matches(request: Request, current_user: dict = Depends(get_current_user)):
    """Generate AI-powered matches for influencers or brands"""
    if current_user["user_type"] == "influencer":
        # Find campaigns matching influencer's niche
        profile = await db.influencer_profiles.find_one({"user_id": current_user["id"]}, {"_id": 0})
        campaigns = await db.campaigns.find({"status": "active"}, {"_id": 0}).to_list(100)

        matches = []
        for campaign in campaigns[:10]:  # Top 10 campaigns
            # Calculate match score
            if EMERGENT_AVAILABLE:
                try:
                    chat = LlmChat(
                        api_key=EMERGENT_LLM_KEY,
                        session_id=f"match_{current_user['id']}_{campaign['id']}",
                        system_message="You are an AI matchmaking expert for influencer marketing. Provide match scores and explanations."
                    ).with_model("openai", "gpt-4o-mini")

                    prompt = f"""Analyze this match:
                    Influencer: {profile.get('bio', 'N/A')}
                    Influencer niches: {', '.join(profile.get('niche_tags', []))}
                    Follower count: {profile.get('follower_count', 0)}
                    Engagement rate: {profile.get('engagement_rate', 0)}%

                    Campaign: {campaign['title']}
                    Campaign description: {campaign['description']}
                    Target niches: {', '.join(campaign.get('niche_tags', []))}
                    Budget: ${campaign['budget']}

                    Provide a match score (0-100) and brief explanation (max 50 words).
                    Format: SCORE: [number]\nEXPLANATION: [text]"""

                    message = UserMessage(text=prompt)
                    response = await chat.send_message(message)

                    # Parse response
                    parts = response.split("EXPLANATION:")
                    score_part = parts[0].replace("SCORE:", "").strip()
                    score = int(''.join(filter(str.isdigit, score_part)))
                    explanation = parts[1].strip() if len(parts) > 1 else "Good match based on niche alignment"
                except Exception as e:
                    logger.warning(f"AI match failed, using fallback: {str(e)}")
                    score, explanation = calculate_match_score(
                        profile.get('niche_tags', []),
                        campaign.get('niche_tags', []),
                        profile.get('follower_count', 0),
                        campaign.get('budget', 0),
                        profile.get('engagement_rate', 0),
                        profile.get('pricing', 0)
                    )
            else:
                # Use fallback scoring
                score, explanation = calculate_match_score(
                    profile.get('niche_tags', []),
                    campaign.get('niche_tags', []),
                    profile.get('follower_count', 0),
                    campaign.get('budget', 0),
                    profile.get('engagement_rate', 0),
                    profile.get('pricing', 0)
                )

            match = Match(
                influencer_id=current_user["id"],
                campaign_id=campaign["id"],
                match_score=min(score, 100),
                ai_explanation=explanation
            )
            match_doc = match.model_dump()
            match_doc["created_at"] = match_doc["created_at"].isoformat()
            await db.matches.update_one(
                {"influencer_id": match.influencer_id, "campaign_id": match.campaign_id},
                {"$set": match_doc},
                upsert=True
            )
            matches.append(match)

        return {"matches": matches, "count": len(matches)}

    else:  # Brand
        # Find influencers for brand's campaigns
        campaigns = await db.campaigns.find({"brand_id": current_user["id"], "status": "active"}, {"_id": 0}).to_list(10)
        if not campaigns:
            return {"matches": [], "count": 0}

        campaign = campaigns[0]  # Use first active campaign
        influencers = await db.influencer_profiles.find({}, {"_id": 0}).to_list(100)

        matches = []
        for influencer in influencers[:10]:  # Top 10 influencers
            # Calculate match score
            if EMERGENT_AVAILABLE:
                try:
                    chat = LlmChat(
                        api_key=EMERGENT_LLM_KEY,
                        session_id=f"match_{campaign['id']}_{influencer['user_id']}",
                        system_message="You are an AI matchmaking expert for influencer marketing."
                    ).with_model("openai", "gpt-4o-mini")

                    prompt = f"""Analyze this match:
                    Campaign: {campaign['title']}
                    Campaign niches: {', '.join(campaign.get('niche_tags', []))}
                    Budget: ${campaign['budget']}

                    Influencer niches: {', '.join(influencer.get('niche_tags', []))}
                    Followers: {influencer.get('follower_count', 0)}
                    Engagement: {influencer.get('engagement_rate', 0)}%
                    Pricing: ${influencer.get('pricing', 0)}

                    Match score (0-100) and explanation (max 50 words).
                    Format: SCORE: [number]\nEXPLANATION: [text]"""

                    message = UserMessage(text=prompt)
                    response = await chat.send_message(message)

                    parts = response.split("EXPLANATION:")
                    score = int(''.join(filter(str.isdigit, parts[0].replace("SCORE:", "").strip())))
                    explanation = parts[1].strip() if len(parts) > 1 else "Good match"
                except Exception as e:
                    logger.warning(f"AI match failed, using fallback: {str(e)}")
                    score, explanation = calculate_match_score(
                        influencer.get('niche_tags', []),
                        campaign.get('niche_tags', []),
                        influencer.get('follower_count', 0),
                        campaign.get('budget', 0),
                        influencer.get('engagement_rate', 0),
                        influencer.get('pricing', 0)
                    )
            else:
                # Use fallback scoring
                score, explanation = calculate_match_score(
                    influencer.get('niche_tags', []),
                    campaign.get('niche_tags', []),
                    influencer.get('follower_count', 0),
                    campaign.get('budget', 0),
                    influencer.get('engagement_rate', 0),
                    influencer.get('pricing', 0)
                )

            match = Match(
                influencer_id=influencer["user_id"],
                campaign_id=campaign["id"],
                match_score=min(score, 100),
                ai_explanation=explanation
            )
            match_doc = match.model_dump()
            match_doc["created_at"] = match_doc["created_at"].isoformat()
            await db.matches.update_one(
                {"influencer_id": match.influencer_id, "campaign_id": match.campaign_id},
                {"$set": match_doc},
                upsert=True
            )
            matches.append(match)

        return {"matches": matches, "count": len(matches)}

@api_router.get("/matches/influencer")
async def get_influencer_matches(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "influencer":
        raise HTTPException(status_code=403, detail="Only influencers can view influencer matches")

    matches = await db.matches.find({"influencer_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return matches

@api_router.get("/matches/brand")
async def get_brand_matches(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "brand":
        raise HTTPException(status_code=403, detail="Only brands can view brand matches")

    campaigns = await db.campaigns.find({"brand_id": current_user["id"]}, {"_id": 0}).to_list(100)
    campaign_ids = [c["id"] for c in campaigns]

    matches = await db.matches.find({"campaign_id": {"$in": campaign_ids}}, {"_id": 0}).to_list(100)
    return matches

# ============ APPLICATION ROUTES ============

@api_router.post("/applications")
async def create_application(app_data: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "influencer":
        raise HTTPException(status_code=403, detail="Only influencers can apply")

    # Check if already applied
    existing = await db.applications.find_one({
        "influencer_id": current_user["id"],
        "campaign_id": app_data.campaign_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this campaign")

    application = Application(
        influencer_id=current_user["id"],
        **app_data.model_dump()
    )
    app_doc = application.model_dump()
    app_doc["created_at"] = app_doc["created_at"].isoformat()

    await db.applications.insert_one(app_doc)
    return application

@api_router.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, status_data: ApplicationStatusUpdate, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify brand owns the campaign
    campaign = await db.campaigns.find_one({"id": application["campaign_id"]}, {"_id": 0})
    if campaign["brand_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"status": status_data.status}}
    )
    return {**application, "status": status_data.status}

# ============ MESSAGE ROUTES ============

@api_router.post("/messages")
async def send_message(msg_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message = Message(
        sender_id=current_user["id"],
        **msg_data.model_dump()
    )
    msg_doc = message.model_dump()
    msg_doc["created_at"] = msg_doc["created_at"].isoformat()

    await db.messages.insert_one(msg_doc)
    return message

@api_router.get("/messages/conversation/{campaign_id}")
async def get_conversation(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Get messages with pagination"""
    query = {
        "campaign_id": campaign_id,
        "$or": [
            {"sender_id": current_user["id"]},
            {"receiver_id": current_user["id"]}
        ]
    }

    # Limit to max 200 per request
    limit = min(limit, 200)

    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    # Reverse to show oldest first
    messages.reverse()
    total = await db.messages.count_documents(query)

    return {
        "data": messages,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + len(messages)) < total
    }

# ============ PAYMENT ROUTES ============

@api_router.post("/payments/create-payment-intent")
async def create_payment(payment_data: PaymentRequest, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "brand":
        raise HTTPException(status_code=403, detail="Only brands can make payments")

    # Get campaign
    campaign = await db.campaigns.find_one({"id": payment_data.campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign["brand_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get influencer pricing
    influencer = await db.influencer_profiles.find_one({"user_id": payment_data.influencer_id}, {"_id": 0})
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")

    amount = influencer.get("pricing", 1000.0)

    # Create Stripe checkout
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    # Use host from request headers for success/cancel URLs
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/payment/success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin}/payment/cancel"

    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "campaign_id": payment_data.campaign_id,
            "influencer_id": payment_data.influencer_id,
            "brand_id": current_user["id"],
            "milestone": payment_data.milestone_description
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_request)

    # Create transaction record
    transaction = Transaction(
        campaign_id=payment_data.campaign_id,
        influencer_id=payment_data.influencer_id,
        brand_id=current_user["id"],
        amount=amount,
        milestone_description=payment_data.milestone_description,
        stripe_session_id=session.session_id,
        status="pending",
        payment_status="initiated"
    )
    txn_doc = transaction.model_dump()
    txn_doc["created_at"] = txn_doc["created_at"].isoformat()
    await db.transactions.insert_one(txn_doc)

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Initialize Stripe
    host_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    # Get status from Stripe
    checkout_status = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    await db.transactions.update_one(
        {"stripe_session_id": session_id},
        {"$set": {
            "payment_status": checkout_status.payment_status,
            "status": "completed" if checkout_status.payment_status == "paid" else "pending"
        }}
    )

    return checkout_status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        # Update transaction based on webhook
        if webhook_response.payment_status == "paid":
            await db.transactions.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "completed"
                }}
            )

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/payments/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["user_type"] == "brand":
        query["brand_id"] = current_user["id"]
    else:
        query["influencer_id"] = current_user["id"]

    transactions = await db.transactions.find(query, {"_id": 0}).to_list(100)
    return transactions

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/campaign/{campaign_id}")
async def get_campaign_analytics(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Calculate real analytics from database
    # Applications count
    applications_count = await db.applications.count_documents({"campaign_id": campaign_id})
    accepted_applications = await db.applications.count_documents({
        "campaign_id": campaign_id,
        "status": "accepted"
    })

    # Messages count
    messages_count = await db.messages.count_documents({"campaign_id": campaign_id})

    # Transactions
    transactions = await db.transactions.find({
        "campaign_id": campaign_id,
        "status": "completed"
    }, {"_id": 0, "amount": 1}).to_list(100)

    total_spent = sum(t.get("amount", 0) for t in transactions)

    # Matches count and average score
    matches = await db.matches.find({
        "campaign_id": campaign_id
    }, {"_id": 0, "match_score": 1}).to_list(100)

    avg_match_score = sum(m.get("match_score", 0) for m in matches) / len(matches) if matches else 0

    # Calculate estimated reach based on accepted influencers
    accepted_apps = await db.applications.find({
        "campaign_id": campaign_id,
        "status": "accepted"
    }, {"_id": 0, "influencer_id": 1}).to_list(100)

    total_reach = 0
    total_engagement = 0
    for app in accepted_apps:
        influencer = await db.influencer_profiles.find_one(
            {"user_id": app["influencer_id"]},
            {"_id": 0, "follower_count": 1, "engagement_rate": 1}
        )
        if influencer:
            total_reach += influencer.get("follower_count", 0)
            total_engagement += influencer.get("follower_count", 0) * influencer.get("engagement_rate", 0) / 100

    # Calculate ROI (estimated)
    budget = campaign.get("budget", 0)
    estimated_conversions = int(total_engagement * 0.02) if total_engagement > 0 else 0  # 2% conversion estimate
    roi = (estimated_conversions * 50 - total_spent) / total_spent if total_spent > 0 else 0  # Assume $50 per conversion

    return {
        "campaign_id": campaign_id,
        "campaign_title": campaign.get("title", ""),
        "reach": int(total_reach),
        "engagement": int(total_engagement),
        "conversions": estimated_conversions,
        "roi": round(roi, 2),
        "applications_count": applications_count,
        "accepted_applications": accepted_applications,
        "messages_count": messages_count,
        "total_spent": total_spent,
        "budget": budget,
        "budget_remaining": budget - total_spent,
        "matches_count": len(matches),
        "avg_match_score": round(avg_match_score, 1)
    }

@api_router.get("/analytics/influencer/growth")
async def get_influencer_growth(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "influencer":
        raise HTTPException(status_code=403, detail="Only influencers can view growth metrics")

    # Get influencer profile
    profile = await db.influencer_profiles.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Influencer profile not found")

    # Count collaborations (accepted applications)
    collaborations_count = await db.applications.count_documents({
        "influencer_id": current_user["id"],
        "status": "accepted"
    })

    # Count total applications
    total_applications = await db.applications.count_documents({
        "influencer_id": current_user["id"]
    })

    # Count matches
    matches_count = await db.matches.count_documents({
        "influencer_id": current_user["id"]
    })

    # Get average match score
    matches = await db.matches.find({
        "influencer_id": current_user["id"]
    }, {"_id": 0, "match_score": 1}).to_list(100)

    avg_match_score = sum(m.get("match_score", 0) for m in matches) / len(matches) if matches else 0

    # Get total earnings from completed transactions
    transactions = await db.transactions.find({
        "influencer_id": current_user["id"],
        "status": "completed"
    }, {"_id": 0, "amount": 1}).to_list(100)

    total_earnings = sum(t.get("amount", 0) for t in transactions)

    # Get pending earnings
    pending_transactions = await db.transactions.find({
        "influencer_id": current_user["id"],
        "status": "pending"
    }, {"_id": 0, "amount": 1}).to_list(100)

    pending_earnings = sum(t.get("amount", 0) for t in pending_transactions)

    # Generate follower growth data (simulated monthly growth based on current followers)
    # In a real app, this would come from historical tracking
    current_followers = profile.get("follower_count", 0)
    follower_growth = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month = datetime.now(timezone.utc).month

    for i in range(6):  # Last 6 months
        month_idx = (current_month - 6 + i) % 12
        # Simulate growth (current followers with slight decline for past months)
        growth_factor = 0.85 + (i * 0.025)  # 85% to 97.5% of current
        followers = int(current_followers * growth_factor)
        follower_growth.append({
            "month": months[month_idx],
            "followers": followers
        })

    return {
        "follower_growth": follower_growth,
        "current_followers": current_followers,
        "engagement_rate": profile.get("engagement_rate", 0),
        "collaborations_count": collaborations_count,
        "total_applications": total_applications,
        "acceptance_rate": round((collaborations_count / total_applications * 100), 1) if total_applications > 0 else 0,
        "matches_count": matches_count,
        "avg_match_score": round(avg_match_score, 1),
        "total_earnings": total_earnings,
        "pending_earnings": pending_earnings,
        "pricing": profile.get("pricing", 0)
    }

# ============ STARTUP EVENT ============

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting CollabConnect application...")

    # Create indexes (idempotent - won't error if they exist)
    try:
        await db.users.create_index("email", unique=True)
        await db.influencer_profiles.create_index("user_id", unique=True)
        await db.brand_profiles.create_index("user_id", unique=True)
        await db.campaigns.create_index("id", unique=True)
        await db.matches.create_index([("influencer_id", 1), ("campaign_id", 1)], unique=True)
        await db.applications.create_index([("influencer_id", 1), ("campaign_id", 1)], unique=True)
        logger.info("Database indexes created/verified")
    except Exception as e:
        logger.warning(f"Index creation warning (may already exist): {str(e)}")

    await generate_mock_data()
    logger.info("Application startup complete")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()