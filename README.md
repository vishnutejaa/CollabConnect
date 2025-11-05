# CollabConnect 🤝

**AI-Powered Influencer Marketing Platform**

CollabConnect is a modern web application that connects social media influencers with brands through intelligent AI-powered matchmaking. The platform streamlines the entire collaboration workflow from discovery to payment.

![Version](https://img.shields.io/badge/version-1.0.0-teal)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### Core Functionality
- **AI-Powered Matching**: Uses GPT-4o-mini to generate match scores (0-100) between influencers and campaigns
- **Dual User Types**: Separate experiences for influencers and brands
- **Campaign Management**: Create, browse, and manage marketing campaigns
- **Application System**: Influencers apply to campaigns, brands review and accept
- **Real-Time Messaging**: Campaign-scoped conversations between brands and influencers
- **Secure Payments**: Stripe integration for milestone-based payments
- **Analytics Dashboard**: Real-time metrics on campaign performance and influencer growth

### Platform Highlights
- 🎯 **Smart Filtering**: Search by niche, budget, follower count, and more
- 📊 **Real Analytics**: Track reach, engagement, ROI, and earnings
- 🔒 **Secure Authentication**: JWT tokens with bcrypt password hashing
- 💳 **Payment Processing**: Stripe Checkout with webhook support
- 📱 **Responsive Design**: Modern UI with Tailwind CSS and Radix UI components
- ⚡ **Performance**: Database indexes and pagination for scalability
- 🛡️ **Rate Limiting**: Protection against abuse and DoS attacks

---

## 🏗️ Architecture

### Tech Stack

**Backend** (`/backend`)
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (async via Motor)
- **Authentication**: JWT + bcrypt
- **AI/LLM**: Emergent Integrations API (GPT-4o-mini)
- **Payments**: Stripe
- **Rate Limiting**: SlowAPI

**Frontend** (`/frontend`)
- **Framework**: React 19
- **Routing**: React Router DOM v7
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Build Tool**: CRACO (Create React App Configuration Override)

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.9+
- **Node.js** 16+
- **MongoDB** 4.4+
- **Yarn** or npm
- **Stripe Account** (for payments)
- **Emergent LLM API Key** (for AI matching)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CollabConnect
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

**Required Environment Variables** (`.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=collabconnect
JWT_SECRET=your-secret-key-min-256-bits
EMERGENT_LLM_KEY=your-emergent-api-key
STRIPE_API_KEY=sk_test_your_stripe_key
CORS_ORIGINS=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install  # or npm install

# Copy environment template
cp .env.example .env

# Edit .env
nano .env
```

**Required Environment Variables** (`.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 4. Initialize Database

```bash
cd backend
python init_db.py
```

This creates all necessary indexes for optimal performance.

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start  # or npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

---

## 📖 User Guide

### For Influencers

1. **Sign Up** as an influencer
2. **Complete Your Profile**: Add bio, niche tags, social media profiles, pricing
3. **Browse Campaigns**: Filter by niche, budget, target audience
4. **Generate Matches**: Get AI-powered recommendations with match scores
5. **Apply to Campaigns**: Send applications with optional messages
6. **Collaborate**: Message brands, negotiate terms
7. **Get Paid**: Receive milestone-based payments via Stripe
8. **Track Growth**: View analytics on earnings, acceptance rate, match scores

### For Brands

1. **Sign Up** as a brand
2. **Complete Your Profile**: Add company name, industry, description
3. **Create Campaigns**: Set title, description, budget, target niche
4. **Find Influencers**: Browse profiles, filter by followers, engagement, pricing
5. **Generate Matches**: Get AI recommendations for your campaigns
6. **Review Applications**: Accept or reject influencer applications
7. **Communicate**: Message selected influencers
8. **Make Payments**: Pay influencers through secure Stripe checkout
9. **Measure Success**: Track campaign reach, engagement, ROI

---

## 🔐 Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, and digits
- **Rate Limiting**:
  - Registration: 5/hour per IP
  - Login: 10/minute per IP
  - Match Generation: 5/hour per user
  - Password Reset: 3/hour per IP
- **Input Validation**: Pydantic models with field constraints
- **CORS Configuration**: Configurable allowed origins
- **JWT Tokens**: 7-day expiration with secure signing
- **Password Hashing**: bcrypt with auto-generated salts
- **Stripe Webhook Verification**: Signature validation

---

## 📊 API Documentation

Once the backend is running, visit http://localhost:8001/docs for interactive API documentation (Swagger UI).

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Campaigns**
- `GET /api/campaigns` - List campaigns (with pagination & filters)
- `POST /api/campaigns` - Create campaign (brands only)
- `GET /api/campaigns/{id}` - Get campaign details
- `PUT /api/campaigns/{id}` - Update campaign
- `GET /api/campaigns/{id}/applications` - List applications for campaign

**Matching**
- `POST /api/matches/generate` - Generate AI matches (rate limited)
- `GET /api/matches/influencer` - Get influencer's matches
- `GET /api/matches/brand` - Get brand's matches

**Applications**
- `POST /api/applications` - Apply to campaign (influencers only)
- `PUT /api/applications/{id}/status` - Accept/reject (brands only)

**Payments**
- `POST /api/payments/create-payment-intent` - Create Stripe checkout session
- `GET /api/payments/status/{session_id}` - Check payment status
- `GET /api/payments/transactions` - List transactions
- `POST /api/webhook/stripe` - Stripe webhook handler

**Analytics**
- `GET /api/analytics/campaign/{id}` - Campaign metrics
- `GET /api/analytics/influencer/growth` - Influencer growth data

---

## 🗄️ Database Schema

### Collections

**users**
- `id` (UUID), `email` (unique), `password_hash`, `user_type`, `created_at`

**influencer_profiles**
- `user_id` (unique), `bio`, `niche_tags[]`, `social_profiles{}`, `follower_count`, `engagement_rate`, `pricing`, `portfolio[]`

**brand_profiles**
- `user_id` (unique), `company_name`, `description`, `industry`, `collaboration_history[]`

**campaigns**
- `id`, `brand_id`, `title`, `description`, `budget`, `target_audience`, `niche_tags[]`, `status`, `created_at`

**matches**
- `id`, `influencer_id`, `campaign_id`, `match_score`, `ai_explanation`, `status`, `created_at`

**applications**
- `id`, `influencer_id`, `campaign_id`, `status`, `message`, `created_at`

**messages**
- `id`, `sender_id`, `receiver_id`, `campaign_id`, `content`, `created_at`

**transactions**
- `id`, `campaign_id`, `influencer_id`, `brand_id`, `amount`, `status`, `milestone_description`, `stripe_session_id`, `payment_status`, `created_at`

### Indexes

All collections have optimized indexes on frequently queried fields:
- Unique indexes on IDs and email
- Compound indexes for filtered queries
- Indexes on status, niche_tags, and foreign keys

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest
```

### Run Frontend Tests
```bash
cd frontend
yarn test
```

---

## 🚢 Deployment

### Backend Deployment

**Option 1: Docker**
```dockerfile
# Dockerfile (create this in /backend)
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Option 2: Railway/Heroku**
- Set environment variables in dashboard
- Deploy from Git repository
- Use `uvicorn server:app --host 0.0.0.0 --port $PORT` as start command

**Option 3: AWS EC2**
- Install Python, MongoDB, and dependencies
- Use systemd service or PM2
- Configure nginx as reverse proxy

### Frontend Deployment

**Build for Production:**
```bash
cd frontend
yarn build
```

**Deploy to:**
- **Vercel**: `vercel --prod`
- **Netlify**: Drag `/build` folder to Netlify dashboard
- **AWS S3 + CloudFront**: Upload `/build` contents to S3 bucket

### MongoDB Hosting

Use **MongoDB Atlas** (free tier available):
1. Create cluster at mongodb.com/cloud/atlas
2. Whitelist your server IP
3. Create database user
4. Copy connection string to `MONGO_URL`

---

## 📈 Performance Optimization

- ✅ Database indexes on all frequently queried fields
- ✅ Pagination for all list endpoints (max 100 per request)
- ✅ Rate limiting to prevent API abuse
- ✅ Async/await throughout backend for non-blocking I/O
- ✅ Match result caching recommended (add Redis)
- ⚠️ Consider CDN for static assets in production
- ⚠️ Implement lazy loading for React routes

---

## 🔧 Configuration

### Customization

**Change Color Scheme** (`frontend/tailwind.config.js`):
```javascript
colors: {
  primary: '#00897B',  // Teal
  secondary: '#26A69A',  // Light teal
  // Customize as needed
}
```

**Adjust Rate Limits** (`backend/server.py`):
```python
@limiter.limit("5/hour")  # Change numbers as needed
```

**CORS Origins** (`.env`):
```env
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found" errors**
```bash
# Backend
pip install -r requirements.txt --upgrade

# Frontend
rm -rf node_modules && yarn install
```

**2. MongoDB connection failed**
- Ensure MongoDB is running: `mongod --version`
- Check `MONGO_URL` in `.env`
- Verify network connectivity

**3. Stripe webhook not working**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:8001/api/webhook/stripe`
- In production, configure webhook URL in Stripe Dashboard

**4. CORS errors**
- Ensure frontend URL is in `CORS_ORIGINS`
- Check backend is running on correct port

**5. AI matching fails**
- Verify `EMERGENT_LLM_KEY` is valid
- Check API quota/limits
- Review logs for specific error messages

---

## 📝 Development Roadmap

### Completed ✅
- Core authentication and authorization
- AI-powered matching engine
- Campaign and application management
- Real-time messaging
- Stripe payment integration
- Real analytics (not mocked)
- Rate limiting and security hardening
- Pagination and advanced filtering
- Password reset functionality
- Database performance optimization

### In Progress 🚧
- Email notifications (SMTP configured)
- File upload for portfolios
- WebSocket for real-time messaging
- Admin panel

### Planned 🔮
- Contract/NDA generation
- Multi-language support
- Mobile applications (React Native)
- Advanced ML matching model
- Social media API integrations
- Video call integration
- Content approval workflow

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- **Python**: Follow PEP 8, use Black formatter
- **JavaScript**: Use ESLint configuration provided
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Email**: support@collabconnect.com

---

## 🙏 Acknowledgments

- **FastAPI** for the excellent Python framework
- **React** team for the UI library
- **Radix UI** for accessible components
- **Stripe** for payment processing
- **Emergent Integrations** for LLM API
- **MongoDB** for the database platform

---

## 📊 Project Stats

- **Backend**: ~1,000 lines of Python
- **Frontend**: ~2,900 lines of JavaScript/JSX
- **UI Components**: 30+ Radix UI components
- **API Endpoints**: 40+ REST endpoints
- **Database Collections**: 8 collections with 30+ indexes

---

**Built with ❤️ for the influencer marketing community**

*CollabConnect - Where Influence Meets Opportunity*
