"""
Database initialization script
Creates indexes for optimal query performance
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_indexes():
    """Create database indexes for performance optimization"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

    print("Creating indexes...")

    # Users collection
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_type")
    print("✓ Users indexes created")

    # Influencer profiles
    await db.influencer_profiles.create_index("user_id", unique=True)
    await db.influencer_profiles.create_index("niche_tags")
    await db.influencer_profiles.create_index("follower_count")
    await db.influencer_profiles.create_index("engagement_rate")
    await db.influencer_profiles.create_index("pricing")
    print("✓ Influencer profiles indexes created")

    # Brand profiles
    await db.brand_profiles.create_index("user_id", unique=True)
    await db.brand_profiles.create_index("industry")
    print("✓ Brand profiles indexes created")

    # Campaigns
    await db.campaigns.create_index("id", unique=True)
    await db.campaigns.create_index("brand_id")
    await db.campaigns.create_index("status")
    await db.campaigns.create_index("niche_tags")
    await db.campaigns.create_index("budget")
    await db.campaigns.create_index("created_at")
    await db.campaigns.create_index([("status", 1), ("niche_tags", 1)])  # Compound index
    print("✓ Campaigns indexes created")

    # Matches
    await db.matches.create_index("id", unique=True)
    await db.matches.create_index("influencer_id")
    await db.matches.create_index("campaign_id")
    await db.matches.create_index("match_score")
    await db.matches.create_index("status")
    await db.matches.create_index([("influencer_id", 1), ("campaign_id", 1)], unique=True)  # Prevent duplicates
    print("✓ Matches indexes created")

    # Applications
    await db.applications.create_index("id", unique=True)
    await db.applications.create_index("influencer_id")
    await db.applications.create_index("campaign_id")
    await db.applications.create_index("status")
    await db.applications.create_index([("influencer_id", 1), ("campaign_id", 1)], unique=True)  # Prevent duplicates
    print("✓ Applications indexes created")

    # Messages
    await db.messages.create_index("id", unique=True)
    await db.messages.create_index("sender_id")
    await db.messages.create_index("receiver_id")
    await db.messages.create_index("campaign_id")
    await db.messages.create_index("created_at")
    await db.messages.create_index([("campaign_id", 1), ("created_at", 1)])  # Compound for pagination
    print("✓ Messages indexes created")

    # Transactions
    await db.transactions.create_index("id", unique=True)
    await db.transactions.create_index("campaign_id")
    await db.transactions.create_index("influencer_id")
    await db.transactions.create_index("brand_id")
    await db.transactions.create_index("status")
    await db.transactions.create_index("stripe_session_id", unique=True, sparse=True)
    print("✓ Transactions indexes created")

    client.close()
    print("\n✅ All indexes created successfully!")

if __name__ == "__main__":
    asyncio.run(create_indexes())
