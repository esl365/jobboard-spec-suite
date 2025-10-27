# Codex Feedback Implementation Plan

**Document Version:** 1.0
**Created:** 2025-10-27
**Status:** Ready to Execute
**Total Estimated Time:** 8-10 hours

---

## 📋 Overview

This document provides detailed implementation steps for the **validated** Codex feedback items. Each action includes:
- Concrete steps with code examples
- Time estimates
- Files to modify
- Validation criteria
- Dependencies and ordering

---

## 🎯 Action Items Summary

| # | Action | Priority | Time | Status |
|---|--------|----------|------|--------|
| 1 | Frontend Next.js Setup | P0 | 2h | ⬜ Pending |
| 2 | Payment Provider Abstraction | P0 | 2-3h | ⬜ Pending |
| 3 | E2E Testing Framework | P1 | 1.5h | ⬜ Pending |
| 4 | Redis Removal from MVP | P2 | 30m | ⬜ Pending |
| 5 | Admin Scope Reduction | P1 | 1h | ⬜ Pending |
| 6 | Revised 1-Week Roadmap | P0 | 1h | ⬜ Pending |

**Total:** 8-10 hours

---

## 1️⃣ Frontend Next.js Setup (P0) - 2 hours

### 🎯 Goal
Create a working Next.js 14 frontend shell with authentication and basic job listing to validate backend integration early.

### 📝 Detailed Steps

#### Step 1.1: Project Initialization (20 min)

```bash
# Create Next.js project in root
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# Configuration prompts:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Import alias: @/*

cd frontend
```

#### Step 1.2: Install Dependencies (10 min)

```bash
# UI components
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react

# Or use shadcn/ui CLI
npx shadcn-ui@latest init

# API client
npm install axios swr
npm install -D @types/node

# Authentication
npm install zustand
```

#### Step 1.3: API Client Setup (20 min)

**File:** `frontend/lib/api-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - attempt refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              localStorage.setItem('accessToken', data.accessToken);
              // Retry original request
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return this.client.request(error.config);
            } catch (refreshError) {
              // Refresh failed - logout
              localStorage.clear();
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async register(email: string, password: string, userType: string) {
    const { data } = await this.client.post('/auth/register', { email, password, userType });
    return data;
  }

  // Jobs
  async getJobs(params?: any) {
    const { data } = await this.client.get('/jobs', { params });
    return data;
  }

  async getJob(id: number) {
    const { data } = await this.client.get(`/jobs/${id}`);
    return data;
  }

  async createJob(jobData: any) {
    const { data } = await this.client.post('/jobs', jobData);
    return data;
  }

  // Applications
  async applyToJob(jobId: number, resumeId: number, coverLetter?: string) {
    const { data } = await this.client.post(`/jobs/${jobId}/apply`, { resumeId, coverLetter });
    return data;
  }
}

export const apiClient = new ApiClient();
```

#### Step 1.4: Auth Store (20 min)

**File:** `frontend/store/auth-store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  userType: 'PERSONAL' | 'COMPANY' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const { apiClient } = await import('@/lib/api-client');
          const data = await apiClient.login(email, password);

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });

          // Store in localStorage for axios interceptor
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        localStorage.clear();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setTokens: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user, isAuthenticated: true });
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### Step 1.5: Basic Pages (50 min)

**File:** `frontend/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/app/jobs/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await apiClient.getJobs();
      setJobs(data.data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading jobs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-4">{job.company?.email}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{job.employmentType}</span>
                  <span className="text-sm font-medium text-green-600">
                    {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()} KRW
                  </span>
                </div>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

#### Step 1.6: Environment Configuration

**File:** `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**File:** `backend/.env` (update)

```bash
# Add CORS for frontend
FRONTEND_URL=http://localhost:3001
```

#### Step 1.7: Backend CORS Update

**File:** `src/main.ts`

```typescript
// Update CORS configuration
app.enableCors({
  origin: [
    'http://localhost:3001', // Next.js dev server
    process.env.FRONTEND_URL,
  ],
  credentials: true,
});
```

### ✅ Validation Criteria

- [ ] Next.js dev server runs (`npm run dev`)
- [ ] Can navigate to /login page
- [ ] Can log in with test credentials
- [ ] Jobs page loads (even if empty)
- [ ] API calls work (check browser Network tab)
- [ ] Auth token persists on refresh
- [ ] No CORS errors in console

### 📦 Deliverables

```
frontend/
├── app/
│   ├── login/page.tsx
│   ├── jobs/page.tsx
│   └── layout.tsx
├── lib/
│   └── api-client.ts
├── store/
│   └── auth-store.ts
├── .env.local
└── package.json
```

---

## 2️⃣ Payment Provider Abstraction (P0) - 2-3 hours

### 🎯 Goal
Refactor payment module to support multiple providers (Toss, Stripe) without changing business logic.

### 📝 Detailed Steps

#### Step 2.1: Define Payment Provider Interface (20 min)

**File:** `src/modules/payment/interfaces/payment-provider.interface.ts`

```typescript
export interface PaymentInitiateResult {
  orderId: string;
  amount: number;
  checkoutUrl: string;
  provider: string;
  providerOrderId?: string;
}

export interface PaymentConfirmResult {
  orderId: string;
  transactionId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: number;
  paidAt: Date;
  raw?: any; // Provider-specific data
}

export interface WebhookValidationResult {
  isValid: boolean;
  eventId?: string;
  data?: any;
}

export interface IPaymentProvider {
  /**
   * Provider name (e.g., 'toss', 'stripe')
   */
  readonly name: string;

  /**
   * Initiate a payment and get checkout URL
   */
  initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult>;

  /**
   * Confirm payment after user completes checkout
   */
  confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult>;

  /**
   * Validate and parse webhook from provider
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult>;
}
```

#### Step 2.2: Refactor Toss Provider (30 min)

**File:** `src/modules/payment/providers/toss-payments.provider.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  IPaymentProvider,
  PaymentInitiateResult,
  PaymentConfirmResult,
  WebhookValidationResult
} from '../interfaces/payment-provider.interface';

@Injectable()
export class TossPaymentsProvider implements IPaymentProvider {
  private readonly logger = new Logger(TossPaymentsProvider.name);
  readonly name = 'toss';
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
  }

  async initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult> {
    const { orderId, amount, orderName, customerEmail } = params;

    // Toss doesn't need pre-call, just return checkout URL
    const checkoutUrl = `${this.configService.get('FRONTEND_URL')}/payment/checkout?orderId=${orderId}&amount=${amount}`;

    return {
      orderId,
      amount,
      checkoutUrl,
      provider: this.name,
    };
  }

  async confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult> {
    const { orderId, paymentKey, amount } = params;

    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/confirm`,
        { orderId, paymentKey, amount },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      return {
        orderId: data.orderId,
        transactionId: data.paymentKey,
        status: data.status === 'DONE' ? 'COMPLETED' : 'FAILED',
        amount: data.totalAmount,
        paidAt: new Date(data.approvedAt),
        raw: data,
      };
    } catch (error) {
      this.logger.error('Toss payment confirmation failed', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // Toss webhook validation logic
    // For now, simple validation
    if (!payload || !payload.orderId) {
      return { isValid: false };
    }

    return {
      isValid: true,
      eventId: payload.orderId,
      data: payload,
    };
  }
}
```

#### Step 2.3: Create Stripe Provider Stub (30 min)

**File:** `src/modules/payment/providers/stripe.provider.ts`

```typescript
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentInitiateResult,
  PaymentConfirmResult,
  WebhookValidationResult
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  readonly name = 'stripe';

  constructor(private configService: ConfigService) {}

  async initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult> {
    // TODO: Implement Stripe Checkout Session
    this.logger.warn('Stripe provider not yet implemented');

    throw new NotImplementedException('Stripe provider coming soon');

    // Future implementation:
    // const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
    // const session = await stripe.checkout.sessions.create({...});
    // return { orderId, amount, checkoutUrl: session.url, provider: 'stripe' };
  }

  async confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult> {
    throw new NotImplementedException('Stripe provider coming soon');
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // TODO: Verify Stripe signature
    throw new NotImplementedException('Stripe provider coming soon');
  }
}
```

#### Step 2.4: Payment Provider Factory (20 min)

**File:** `src/modules/payment/payment-provider.factory.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from './interfaces/payment-provider.interface';
import { TossPaymentsProvider } from './providers/toss-payments.provider';
import { StripeProvider } from './providers/stripe.provider';

export type PaymentProviderType = 'toss' | 'stripe';

@Injectable()
export class PaymentProviderFactory {
  private providers: Map<PaymentProviderType, IPaymentProvider>;

  constructor(
    private tossProvider: TossPaymentsProvider,
    private stripeProvider: StripeProvider,
  ) {
    this.providers = new Map([
      ['toss', tossProvider],
      ['stripe', stripeProvider],
    ]);
  }

  getProvider(type: PaymentProviderType): IPaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Payment provider '${type}' not found`);
    }
    return provider;
  }

  getDefaultProvider(): IPaymentProvider {
    // For Korea, default to Toss
    return this.getProvider('toss');
  }
}
```

#### Step 2.5: Refactor PaymentService (40 min)

**File:** `src/modules/payment/payment.service.ts` (update)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PaymentProviderFactory, PaymentProviderType } from './payment-provider.factory';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentInitiateResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  async initiatePayment(
    initiateDto: InitiatePaymentDto,
    userId: number,
    providerType: PaymentProviderType = 'toss', // Default to Toss for Korea
  ): Promise<PaymentInitiateResponseDto> {
    const { amount, productType, packageId, orderName } = initiateDto;

    // Validate package if provided
    if (packageId) {
      const pkg = await this.prisma.productPackage.findUnique({
        where: { id: packageId },
      });
      // ... validation logic
    }

    // Create pending order
    const order = await this.prisma.order.create({
      data: {
        userId: BigInt(userId),
        packageId: packageId || null,
        totalAmount: amount,
        status: 'PENDING',
        provider: providerType, // Store provider type
      },
    });

    const orderId = `ORDER_${order.id}`;

    // Get user for email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Use provider through factory
    const provider = this.providerFactory.getProvider(providerType);
    const result = await provider.initiate({
      orderId,
      amount,
      orderName: orderName || `Order #${order.id}`,
      customerEmail: user?.email || '',
    });

    this.logger.log(
      `Payment initiated: orderId=${orderId}, provider=${providerType}, amount=${amount}`,
    );

    return {
      orderId: result.orderId,
      amount: result.amount,
      checkoutUrl: result.checkoutUrl,
      provider: providerType,
    };
  }

  async confirmPayment(confirmDto: ConfirmPaymentDto): Promise<any> {
    const { orderId, paymentKey, amount } = confirmDto;

    // Find order
    const order = await this.prisma.order.findFirst({
      where: { id: BigInt(orderId.replace('ORDER_', '')) },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get provider from order
    const providerType = (order.provider || 'toss') as PaymentProviderType;
    const provider = this.providerFactory.getProvider(providerType);

    // Confirm with provider
    const result = await provider.confirm({
      orderId,
      paymentKey,
      amount,
    });

    // Update order
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
        paidAt: result.paidAt,
        providerPaymentId: result.transactionId,
      },
    });

    // If completed, add points
    if (result.status === 'COMPLETED') {
      await this.prisma.pointTransaction.create({
        data: {
          userId: order.userId,
          amount: Number(order.totalAmount),
          type: 'PURCHASE',
          orderId: order.id,
        },
      });
    }

    return result;
  }

  async handleWebhook(
    provider: PaymentProviderType,
    payload: any,
    signature?: string,
  ): Promise<any> {
    const paymentProvider = this.providerFactory.getProvider(provider);
    const validation = await paymentProvider.handleWebhook(payload, signature);

    if (!validation.isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook data
    // ...

    return { ok: true };
  }
}
```

#### Step 2.6: Update Module & Controller (20 min)

**File:** `src/modules/payment/payment.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TossPaymentsProvider } from './providers/toss-payments.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    TossPaymentsProvider,
    StripeProvider,
    PaymentProviderFactory,
    PrismaService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
```

**File:** `src/modules/payment/payment.controller.ts` (update)

```typescript
// Add query parameter for provider selection
@Post('initiate')
@UseGuards(JwtAuthGuard)
async initiatePayment(
  @Body() initiateDto: InitiatePaymentDto,
  @Req() req: any,
  @Query('provider') provider: PaymentProviderType = 'toss',
): Promise<PaymentInitiateResponseDto> {
  return this.paymentService.initiatePayment(
    initiateDto,
    req.user.id,
    provider,
  );
}
```

#### Step 2.7: Update Database Schema (10 min)

**File:** `prisma/schema.prisma` (update Order model)

```prisma
model Order {
  id                 BigInt   @id @default(autoincrement())
  userId             BigInt   @map("user_id")
  packageId          Int?     @map("package_id")
  totalAmount        Int      @map("total_amount")
  status             String   @default("PENDING") // PENDING, COMPLETED, FAILED, REFUNDED
  provider           String?  @default("toss") // NEW: 'toss', 'stripe'
  providerPaymentId  String?  @map("provider_payment_id")
  paidAt             DateTime? @map("paid_at")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  user               User     @relation(fields: [userId], references: [id])
  package            ProductPackage? @relation(fields: [packageId], references: [id])
  pointTransactions  PointTransaction[]

  @@map("orders")
}
```

```bash
# Generate migration
npx prisma migrate dev --name add_provider_to_order
```

### ✅ Validation Criteria

- [ ] Interface defined with clear method signatures
- [ ] Toss provider refactored and working
- [ ] Stripe stub created (throws NotImplementedException)
- [ ] Factory pattern implemented
- [ ] PaymentService uses factory
- [ ] Can select provider via query param
- [ ] Database schema updated
- [ ] Existing tests still pass
- [ ] New provider can be added in < 1 hour

### 📊 Success Metrics

```typescript
// Test: Can switch providers
POST /payments/initiate?provider=toss  // Works
POST /payments/initiate?provider=stripe // Throws NotImplementedException (expected)

// Test: Easy to add new provider
class PaypalProvider implements IPaymentProvider {
  // Implement 3 methods
}
// Register in factory → Done!
```

---

## 3️⃣ E2E Testing Framework (P1) - 1.5 hours

### 🎯 Goal
Set up E2E testing framework and create critical path tests to run starting Day 4.

### 📝 Detailed Steps

#### Step 3.1: Install Playwright (10 min)

```bash
cd backend
npm install -D @playwright/test
npx playwright install
```

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false, // Sequential for database state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for MVP
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001', // Next.js frontend
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm run start:dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

#### Step 3.2: Test Helpers (20 min)

**File:** `test/e2e/helpers/test-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createTestUser(type: 'PERSONAL' | 'COMPANY' = 'PERSONAL') {
  const email = `test-${type.toLowerCase()}-${Date.now()}@example.com`;
  const password = 'Test1234!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      userType: type,
      status: 'ACTIVE',
    },
  });

  return { user, email, password };
}

export async function createTestJob(companyUserId: number) {
  const job = await prisma.job.create({
    data: {
      title: `Test Job ${Date.now()}`,
      description: 'Test job description',
      employmentType: 'FULL_TIME',
      salaryType: 'ANNUAL',
      salaryMin: 50000000,
      salaryMax: 70000000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      companyUserId: BigInt(companyUserId),
      status: 'ACTIVE',
    },
  });

  return job;
}

export async function cleanupTestData() {
  // Delete in reverse order of foreign keys
  await prisma.jobApplication.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
}
```

#### Step 3.3: Critical Path Tests (60 min)

**File:** `test/e2e/critical-path.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, createTestJob, cleanupTestData } from './helpers/test-data';

test.describe('Critical User Journey', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('Company posts job → Candidate applies → Status updates', async ({ page, context }) => {
    // 1. Company Registration & Login
    const { email: companyEmail, password: companyPassword } = await createTestUser('COMPANY');

    await page.goto('/login');
    await page.fill('input[type="email"]', companyEmail);
    await page.fill('input[type="password"]', companyPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/jobs');

    // 2. Post a Job
    await page.click('text=Post Job');
    await page.fill('input[name="title"]', 'Senior Backend Developer');
    await page.fill('textarea[name="description"]', 'Looking for experienced Node.js developer');
    await page.fill('input[name="salaryMin"]', '60000000');
    await page.fill('input[name="salaryMax"]', '80000000');
    await page.click('button:has-text("Publish")');

    await expect(page.locator('text=Job posted successfully')).toBeVisible();
    const jobId = await page.locator('[data-job-id]').first().getAttribute('data-job-id');

    // Logout
    await page.click('text=Logout');

    // 3. Candidate Registration & Login
    const { email: candidateEmail, password: candidatePassword } = await createTestUser('PERSONAL');

    await page.goto('/login');
    await page.fill('input[type="email"]', candidateEmail);
    await page.fill('input[type="password"]', candidatePassword);
    await page.click('button[type="submit"]');

    // 4. Browse & Apply to Job
    await page.goto('/jobs');
    await page.click(`[data-job-id="${jobId}"]`);

    await expect(page.locator('h1')).toContainText('Senior Backend Developer');

    // Upload resume first (simplified - may need multipart handling)
    // await page.setInputFiles('input[type="file"]', 'test/fixtures/resume.pdf');
    // For MVP, assume resume exists or skip

    await page.click('button:has-text("Apply Now")');
    await expect(page.locator('text=Application submitted')).toBeVisible();

    // 5. Check Application Status
    await page.goto('/applications');
    await expect(page.locator('[data-status="RECEIVED"]')).toBeVisible();

    // 6. Company Reviews Application
    await page.click('text=Logout');
    await page.goto('/login');
    await page.fill('input[type="email"]', companyEmail);
    await page.fill('input[type="password"]', companyPassword);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/applications');
    await expect(page.locator('text=1 new application')).toBeVisible();

    // Move to screening
    await page.click('[data-application-stage="RECEIVED"]');
    await page.click('button:has-text("Move to Screening")');
    await expect(page.locator('[data-application-stage="SCREENING"]')).toBeVisible();
  });

  test('Payment flow: Initiate → Confirm → Points added', async ({ page }) => {
    const { email, password } = await createTestUser('COMPANY');

    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Go to pricing/payment page
    await page.goto('/pricing');
    await page.click('button:has-text("Buy Pro")');

    // Should redirect to checkout
    await expect(page).toHaveURL(/.*checkout.*/);

    // In test mode, we might need to mock Toss payment
    // For MVP, just verify initiation works
    await expect(page.locator('[data-order-id]')).toBeVisible();

    const orderId = await page.locator('[data-order-id]').textContent();
    expect(orderId).toContain('ORDER_');
  });
});
```

### ✅ Validation Criteria

- [ ] Playwright installed and configured
- [ ] Can run `npx playwright test`
- [ ] Test helpers create/cleanup data
- [ ] Critical path test covers: register → login → post → apply → status
- [ ] Tests run sequentially (database state)
- [ ] Screenshots on failure
- [ ] HTML report generated

### 📅 Execution Plan

- **Day 1-3:** Write tests (don't run yet - frontend incomplete)
- **Day 4:** Start running tests as features complete
- **Day 5-6:** Fix issues found by E2E tests

---

## 4️⃣ Redis Removal from MVP (P2) - 30 minutes

### 🎯 Goal
Simplify infrastructure by removing unused Redis for MVP.

### 📝 Detailed Steps

#### Step 4.1: Remove from Docker Compose (5 min)

**File:** `docker-compose.yml`

```yaml
# Comment out or remove Redis service
# redis:
#   image: redis:7-alpine
#   container_name: jobboard-redis
#   ...
```

#### Step 4.2: Remove Environment Variables (5 min)

**File:** `.env.example` and `.env`

```bash
# Comment out Redis config
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=redis_pass
```

#### Step 4.3: Remove Dependencies (if any) (5 min)

```bash
# Check if redis packages are installed
npm list | grep redis

# If found, remove
npm uninstall redis ioredis @nestjs/redis
```

#### Step 4.4: Document Re-addition Plan (15 min)

**File:** `docs/FUTURE_REDIS_INTEGRATION.md`

```markdown
# Redis Integration (Post-MVP)

## When to Add Back

Add Redis when we need:
1. **Caching** - Job listing queries (> 1000 jobs)
2. **Real-time** - WebSocket pub/sub for notifications
3. **Rate Limiting** - Distributed rate limiter
4. **Session Store** - Replace JWT-only with Redis sessions

## Estimated Effort

**Phase 1: Basic Caching (Week 2-3)**
- Job list cache (30 min)
- Search results cache (1 hour)
- Cache invalidation (1 hour)

**Phase 2: Real-time (Month 2)**
- Redis pub/sub setup (2 hours)
- WebSocket integration (4 hours)
- Testing (2 hours)

## Integration Points

```typescript
// Job Service (future)
async findAll(query) {
  const cacheKey = `jobs:list:${JSON.stringify(query)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await this.prisma.job.findMany(...);
  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
  return result;
}
```
```

### ✅ Validation Criteria

- [ ] Docker Compose starts without Redis
- [ ] Application runs normally
- [ ] No Redis connection errors in logs
- [ ] Tests still pass
- [ ] Re-addition plan documented

---

## 5️⃣ Admin Scope Reduction (P1) - 1 hour

### 🎯 Goal
Minimize admin dashboard to essential stats only for MVP.

### 📝 Detailed Steps

#### Step 5.1: Define MVP Admin Features (10 min)

**Scope IN:**
- ✅ User count (total, by type)
- ✅ Job count (total, active, expired)
- ✅ Application count (total, by status)
- ✅ Revenue summary (total orders, total amount)

**Scope OUT (Phase 2):**
- ❌ User management (ban, edit, delete)
- ❌ Job moderation (approve, reject, edit)
- ❌ Detailed analytics (graphs, trends)
- ❌ System settings UI
- ❌ Email template management

#### Step 5.2: Simplify Admin Controller (20 min)

**File:** `src/modules/admin/admin.controller.ts` (simplified)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const [users, jobs, applications, revenue] = await Promise.all([
      this.adminService.getUserStats(),
      this.adminService.getJobStats(),
      this.adminService.getApplicationStats(),
      this.adminService.getPaymentStats(),
    ]);

    return {
      users,
      jobs,
      applications,
      revenue,
      timestamp: new Date().toISOString(),
    };
  }
}
```

#### Step 5.3: Keep Service Simple (10 min)

**File:** `src/modules/admin/admin.service.ts` (verify simplicity)

```typescript
// Current implementation is already minimal
// Just verify these methods exist and are simple

async getUserStats() {
  const total = await this.prisma.user.count();
  const byType = await this.prisma.user.groupBy({
    by: ['userType'],
    _count: true,
  });
  return { total, byType };
}

// Similar for other stats
```

#### Step 5.4: Frontend MVP Admin Page (20 min)

**File:** `frontend/app/admin/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiClient.get('/admin/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load dashboard</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
          <div className="mt-4 text-sm text-gray-600">
            <div>Companies: {stats.users.byType.find(t => t.userType === 'COMPANY')?._count || 0}</div>
            <div>Job Seekers: {stats.users.byType.find(t => t.userType === 'PERSONAL')?._count || 0}</div>
          </div>
        </div>

        {/* Jobs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Jobs</h3>
          <p className="text-3xl font-bold mt-2">{stats.jobs.total}</p>
          <div className="mt-4 text-sm text-gray-600">
            <div>Active: {stats.jobs.active}</div>
            <div>Closed: {stats.jobs.closed}</div>
          </div>
        </div>

        {/* Applications */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Applications</h3>
          <p className="text-3xl font-bold mt-2">{stats.applications.total}</p>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            ₩{stats.revenue.totalAmount.toLocaleString()}
          </p>
          <div className="mt-4 text-sm text-gray-600">
            <div>Orders: {stats.revenue.totalOrders}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
        <button
          onClick={loadStats}
          className="ml-4 text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
```

### ✅ Validation Criteria

- [ ] Admin endpoint returns dashboard data
- [ ] Frontend shows 4 stat cards
- [ ] No complex management features
- [ ] Loads in < 1 second
- [ ] Refresh button works

---

## 6️⃣ Revised 1-Week Roadmap (P0) - 1 hour

### 🎯 Goal
Update the 1-week plan incorporating all Codex feedback.

### 📝 New Roadmap

**File:** `docs/REVISED_1WEEK_ROADMAP.md`

```markdown
# Revised 1-Week MVP Roadmap

## Day 1 (Monday) - 4-5 hours

### Morning (2-3 hours) - Frontend Foundation
- [ ] Next.js 14 project setup (20 min)
- [ ] API client + Auth store (40 min)
- [ ] Login page + Jobs list page (1 hour)
- [ ] Test: Can login, see jobs list (even if empty)

### Afternoon (2 hours) - Backend Refinements
- [ ] Payment provider abstraction (1.5 hours)
  - Interface, Toss refactor, Stripe stub, Factory
- [ ] Database migration for provider field (10 min)
- [ ] Quick manual test (20 min)

**End of Day 1:**
✅ Working frontend shell
✅ Payment abstraction ready for future
✅ Can see "full stack" (backend + frontend)

---

## Day 2 (Tuesday) - 4 hours

### Frontend Core (4 hours)
- [ ] Job posting page (1.5 hours)
  - Form with validation
  - Template selection (if ready)
- [ ] Job detail page (1 hour)
  - Display job info
  - Apply button
- [ ] Application form (1 hour)
  - Resume selection/upload
  - Cover letter
- [ ] Basic navigation & layout (30 min)

**End of Day 2:**
✅ Can post a job
✅ Can view job details
✅ Can apply to job

---

## Day 3 (Wednesday) - 4 hours

### Integration & Refinement (4 hours)
- [ ] Company dashboard (1.5 hours)
  - List my jobs
  - View applications
- [ ] Candidate dashboard (1 hour)
  - My applications
  - Status display
- [ ] Email notifications working (1 hour)
  - Application received
  - Status changes
- [ ] Styling polish (30 min)
  - Make it not ugly

**End of Day 3:**
✅ Full user journey works
✅ Email notifications send
✅ Dashboard shows data

---

## Day 4 (Thursday) - 4 hours

### Testing & E2E (4 hours)
- [ ] E2E test setup (if not done) (30 min)
- [ ] Run E2E critical path (30 min)
- [ ] Fix integration bugs found (2 hours)
- [ ] Manual testing (1 hour)
  - Register → Post → Apply → Email
  - Check all happy paths

**End of Day 4:**
✅ E2E tests passing (or close)
✅ Major integration issues fixed
✅ Confident in core flow

---

## Day 5 (Friday) - 3 hours

### Admin & Edge Cases (3 hours)
- [ ] Minimal admin dashboard (1 hour)
  - Stats only (4 cards)
- [ ] Error handling (1 hour)
  - Show errors nicely
  - Handle edge cases
- [ ] Validation improvements (1 hour)
  - Better form validation
  - API error messages

**End of Day 5:**
✅ Admin can see stats
✅ Errors handled gracefully
✅ No crashes on bad input

---

## Day 6 (Saturday) - 3 hours

### Performance & Polish (3 hours)
- [ ] Performance check (1 hour)
  - API response times < 200ms
  - Frontend loads < 2s
- [ ] UI polish (1 hour)
  - Consistent spacing
  - Loading states
  - Success/error messages
- [ ] Mobile responsive check (1 hour)
  - Test on mobile viewport
  - Fix major issues

**End of Day 6:**
✅ Fast and responsive
✅ Looks professional
✅ Works on mobile

---

## Day 7 (Sunday) - 3 hours

### Documentation & Deployment (3 hours)
- [ ] README update (30 min)
  - Setup instructions
  - Environment variables
  - Running locally
- [ ] Deployment (1.5 hours)
  - Choose platform (Railway/Render/Vercel)
  - Deploy backend + frontend
  - Configure environment
- [ ] Smoke test production (1 hour)
  - Register test user
  - Post test job
  - Apply to job
  - Verify emails

**End of Day 7:**
✅ Deployed to production
✅ Working end-to-end in prod
✅ Ready for beta users

---

## Scope Guarantee

### IN Scope:
- ✅ User registration & login
- ✅ Company posts job
- ✅ Candidate applies
- ✅ Email notifications
- ✅ Basic dashboards
- ✅ Admin stats (view only)
- ✅ Payment initiation (flow exists)

### OUT of Scope (Phase 2):
- ❌ Advanced job search filters
- ❌ Resume parsing
- ❌ Video interviews
- ❌ Team collaboration features
- ❌ Advanced analytics
- ❌ Payment confirmation (full flow)
- ❌ User management tools

## Success Criteria

**MVP is complete when:**
1. New user can register
2. Company can post job in < 2 minutes
3. Candidate can browse and apply
4. Email notifications work
5. Status updates visible
6. Admin can see stats
7. Deployed and accessible online
8. No critical bugs in happy path

## Risk Mitigation

**Top Risks:**
1. **Frontend takes longer** → Cut features, keep core only
2. **Integration issues** → E2E tests catch early (Day 4)
3. **Deployment problems** → Test deploy on Day 5, fix Day 6
4. **Scope creep** → Strict "NO" to new features

**Contingency:**
If behind schedule by Day 5:
- Cut admin dashboard
- Cut email templates (use plain text)
- Cut styling polish
- Focus on working > pretty
```

### ✅ Validation Criteria

- [ ] Daily goals are clear and concrete
- [ ] Each day has 3-5 hour scope
- [ ] Frontend starts Day 1 (not Day 2)
- [ ] E2E testing starts Day 4 (not Day 6)
- [ ] Admin reduced to stats only
- [ ] Clear IN/OUT scope defined
- [ ] Risk mitigation planned

---

## 📊 Summary & Next Steps

### Implementation Priority

```
Day 1 (Today):
🔴 P0: Frontend Next.js Setup (2h)
🔴 P0: Payment Abstraction (2h)

Day 2-3:
🟡 P1: E2E Framework (1.5h)
🟡 P1: Admin Reduction (1h)

Day 1-7:
🟢 P2: Redis Removal (30m) - anytime
🟢 P0: Follow revised roadmap (documented)
```

### Total Time Investment

```
Frontend Setup:       2 hours
Payment Abstraction:  2-3 hours
E2E Framework:        1.5 hours
Admin Reduction:      1 hour
Redis Removal:        30 min
Roadmap Document:     1 hour
─────────────────────────────
Total:                8-10 hours
```

### Execution Order

1. **Start with Frontend** (highest risk, most important)
2. **Payment Abstraction** (while frontend npm installing)
3. **E2E Framework** (Day 4, but prep now)
4. **Redis Removal** (low priority, anytime)
5. **Admin Reduction** (Day 5)
6. **Follow Revised Roadmap** (Day 1-7)

---

## ✅ Approval Checklist

Before starting implementation:

- [ ] Reviewed all 6 action items
- [ ] Time estimates seem reasonable
- [ ] Have all necessary tools (Node, npm, Docker)
- [ ] Backend is currently working (60/60 tests)
- [ ] Ready to commit 8-10 hours over next 2 days
- [ ] Understand scope (MVP only, no feature creep)

---

**Ready to execute?** 🚀

Start with **Action Item #1: Frontend Next.js Setup**

**Generated:** 2025-10-27
**Status:** Ready for Execution
**Expected Completion:** Day 1-2 (for Codex feedback items)
