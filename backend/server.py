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
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']

security = HTTPBearer()

# Create the main app
app = FastAPI()
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
    password: str
    user_type: str

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
    title: str
    description: str
    budget: float
    target_audience: str = ""
    niche_tags: List[str] = []

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
    message: str = ""

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
    content: str

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
    except Exception:
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
async def register(user_data: UserRegister):
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
async def login(credentials: UserLogin):
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

# ============ INFLUENCER ROUTES ============

@api_router.get("/influencers")
async def get_influencers(niche: Optional[str] = None):
    query = {}
    if niche:
        query["niche_tags"] = {"$in": [niche]}

    influencers = await db.influencer_profiles.find(query, {"_id": 0}).to_list(100)
    return influencers

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
async def get_campaigns(status: Optional[str] = None, niche: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if niche:
        query["niche_tags"] = {"$in": [niche]}

    campaigns = await db.campaigns.find(query, {"_id": 0}).to_list(100)
    return campaigns

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

@api_router.post("/matches/generate")
async def generate_matches(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered matches for influencers or brands"""
    if current_user["user_type"] == "influencer":
        # Find campaigns matching influencer's niche
        profile = await db.influencer_profiles.find_one({"user_id": current_user["id"]}, {"_id": 0})
        campaigns = await db.campaigns.find({"status": "active"}, {"_id": 0}).to_list(100)

        matches = []
        for campaign in campaigns[:10]:  # Top 10 campaigns
            # Calculate match score using AI
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
            try:
                parts = response.split("EXPLANATION:")
                score_part = parts[0].replace("SCORE:", "").strip()
                score = int(''.join(filter(str.isdigit, score_part)))
                explanation = parts[1].strip() if len(parts) > 1 else "Good match based on niche alignment"
            except:
                score = 75
                explanation = "Match based on niche alignment and audience fit"

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

            try:
                parts = response.split("EXPLANATION:")
                score = int(''.join(filter(str.isdigit, parts[0].replace("SCORE:", "").strip())))
                explanation = parts[1].strip() if len(parts) > 1 else "Good match"
            except:
                score = 75
                explanation = "Match based on niche alignment"

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
async def get_conversation(campaign_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "campaign_id": campaign_id,
        "$or": [
            {"sender_id": current_user["id"]},
            {"receiver_id": current_user["id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return messages

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

    # Mock analytics data
    return {
        "campaign_id": campaign_id,
        "reach": 250000,
        "engagement": 12500,
        "conversions": 450,
        "roi": 3.2
    }

@api_router.get("/analytics/influencer/growth")
async def get_influencer_growth(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "influencer":
        raise HTTPException(status_code=403, detail="Only influencers can view growth metrics")

    # Mock growth data
    return {
        "follower_growth": [
            {"month": "Jan", "followers": 100000},
            {"month": "Feb", "followers": 110000},
            {"month": "Mar", "followers": 125000}
        ],
        "engagement_rate": 5.2,
        "collaborations_count": 8
    }

# ============ STARTUP EVENT ============

@app.on_event("startup")
async def startup_event():
    await generate_mock_data()

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