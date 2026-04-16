# 🛒 Eshop – Multivendor eCommerce Platform (Microservices-Based)

> Built with ❤️ by **Becodemy**  
> A scalable, modern eCommerce SaaS with seller dashboard, real-time analytics, and microservice architecture.

---

## ⚠️ Legal Disclaimer

This source code is **licensed for individual use only**.

> 🚫 **Strictly Prohibited:**  
> Sharing, reselling, publishing to GitHub/public repos, or redistributing this codebase in any form is a **violation of licensing terms**.

We retain full rights under the **laws of the United Kingdom and Wales**. Legal actions will be taken in case of any misuse. We actively monitor license violations.

---

# 🚀 Eshop - Local Development Setup

A simple guide to run the e-commerce platform locally on your machine.

## 📋 Prerequisites

Before you start, make sure you have these installed:

- **Node.js** (v20.19.3)
- **Docker Desktop** (for Kafka)
- **pnpm** (recommended)

## 🛠️ Quick Setup Guide

### 1. Download & Setup Project

```bash
# Download the code from GitHub and unzip it
# Navigate to the project root directory
cd eshop

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Create `.env` files in the following locations:

#### Root Directory (`.env`)

```bash
# Copy from .env.example if available, or create new
touch .env
```

#### User UI (`.env`)

```bash
cd apps/user-ui
touch .env
```

#### Seller UI (`.env`)

```bash
cd apps/seller-ui
touch .env
```

#### Admin UI (`.env`)

```bash
cd apps/admin-ui
touch .env
```

### 3. Required Environment Variables

Fill in your `.env` files with the following variables:

#### Root `.env` (Backend Services)

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/eshop-db"

# Redis
REDIS_DATABASE_URI="rediss://your-redis-url.upstash.io"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# SMTP (Email)
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."

# ImageKit (Image CDN)
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_SECRET_KEY="private_..."
# KAFKA_BROKERS=kafka:29092 only for production
# Use local Kafka for development
KAFKA_BROKERS=localhost:9092
```

#### UI `.env` files (Frontend Apps)

```env
# API Gateway URL
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_SERVER_URI="http://localhost:8080"
```

### 4. Database Setup

```bash
# Push the database schema
npx prisma db push
```

### 5. Start Kafka Infrastructure

```bash
# Make sure Docker Desktop is running
# Start Kafka services
npm run kafka:dev:up

# Wait for Kafka to fully start (check Docker Desktop)
```

### 6. Start All Services

```bash
# Start all backend services
npm run dev

# In separate terminals, start the frontend apps:
npm run user-ui    # Runs on http://localhost:3000
npm run seller-ui  # Runs on http://localhost:3001
npm run admin-ui   # Runs on http://localhost:3002
```

## 🌐 Access Your Applications

Once everything is running:

| Application          | URL                   | Description                 |
| -------------------- | --------------------- | --------------------------- |
| **User Frontend**    | http://localhost:3000 | Main customer-facing app    |
| **Seller Dashboard** | http://localhost:3001 | Seller management interface |
| **Admin Panel**      | http://localhost:3002 | Admin control center        |
| **API Gateway**      | http://localhost:8080 | Backend API endpoint        |

## 🔧 Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Check what's using the port
lsof -i :3000
# Kill the process or use different ports
```

**Kafka not starting:**

```bash
# Check Docker Desktop is running
# Restart Kafka
npm run kafka:dev:down
npm run kafka:dev:up
```

**Environment variables not loading:**

- Ensure `.env` files are in the correct locations
- Restart services after changing `.env` files
- Check for typos in variable names

**Database connection issues:**

```bash
# Test database connection
npx prisma db push
# Check your DATABASE_URL in .env
```

### Useful Commands

```bash
# Stop all services
npm run kafka:dev:down

# Clear NX cache
npx nx reset

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check service status
docker ps
```

## 📁 Project Structure

```
eshop/
├── apps/
│   ├── user-ui/          # Customer frontend (port 3000)
│   ├── seller-ui/        # Seller dashboard (port 3001)
│   ├── admin-ui/         # Admin panel (port 3002)
│   ├── auth-service/     # Authentication (port 6001)
│   ├── product-service/  # Products (port 6002)
│   ├── order-service/    # Orders (port 6003)
│   ├── seller-service/   # Seller management (port 6004)
│   ├── admin-service/    # Admin operations (port 6005)
│   ├── chatting-service/ # Real-time chat (port 6006)
│   ├── recommendation-service/ # AI recommendations (port 6007)
│   ├── logger-service/   # Logging (port 6008)
│   └── api-gateway/      # API gateway (port 8080)
├── packages/             # Shared packages
└── prisma/              # Database schema
```

## 🎯 Next Steps

1. **Create test accounts** in the user interface
2. **Explore the seller dashboard** to manage products
3. **Test the admin panel** for system management

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Verify your environment variables are correct
4. Check that Docker Desktop is running for Kafka

---

**Happy coding! 🚀**
