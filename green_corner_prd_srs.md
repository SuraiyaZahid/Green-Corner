# Green Corner — Product Requirements Document (PRD) & Software Requirements Specification (SRS)

**Author:** Suraiya Zahid  
**Project:** Green Corner E-Commerce Platform  
**Contact Email:** suraiyazahid085@gmail.com  
**Contact Phone:** 01735262232  
**Location Base:** Kuril Bisso Road, Dhaka, Bangladesh  
**Tech Stack:** Next.js (TypeScript), NestJS (TypeScript), PostgreSQL (Neon), Prisma ORM, Vercel  
**Architecture:** Model-View-Controller (MVC) API-Driven Architecture  

---

## Part 1: Product Requirements Document (PRD)

### 1. Executive Summary
**Green Corner** is a modern, full-stack e-commerce platform in Bangladesh designed to provide plant enthusiasts with direct online access to indoor and outdoor plants, organic fertilizers (*Joibo Sar*), harvesting/watering tools, seed packets (flowers & vegetables), and pots (*Tob*). The platform incorporates local payment integration (bKash, Nagad, Cash on Delivery) and an intuitive Admin Panel for inventory and order management.

### 2. Product Objectives & Target Audience
* **Objective:** Deliver a responsive, user-friendly shopping experience with real-time stock management and transparent payment processing.
* **Target Audience:** Rooftop gardeners, indoor home decor enthusiasts, plant hobbyists, and commercial growers in Bangladesh.

### 3. Core Product Features

#### 3.1 Customer Storefront (Public User)
1. **Catalog & Categorization:**
   * Indoor Plants
   * Outdoor Plants
   * Compost & Fertilizers (*Joibo Sar*)
   * Gardening Equipment (Watering cans, planting tools, harvesting shears)
   * Seed Packets (Flower and Vegetable seeds)
   * Pots & Planters (*Tob*)
2. **Product Details & Search:** Filter by category, view high-res product photos, stock availability, care instructions, and pricing.
3. **Cart & Checkout System:** Add/remove items, specify shipping address, and choose payment methods.
4. **Payment Options:**
   * **Cash on Delivery (COD)**
   * **bKash & Nagad Manual Transfer:**
     * Merchant / Receiver Number shown: **`01735262232`**
     * Inputs for customer's sender mobile number and unique Transaction ID (TrxID).
5. **Universal Footer:** Displays corporate details on all pages:
   * **Phone:** `01735262232`
   * **Email:** `suraiyazahid085@gmail.com`
   * **Address:** Kuril Bisso Road, Dhaka, Bangladesh

#### 3.2 Admin Panel
1. **Product Inventory Management (CRUD):** Add, update price/stock, upload images, and remove products.
2. **Order & Verification Center:** View orders, verify bKash/Nagad TrxIDs, and update order statuses (`PENDING`, `PROCESSING`, `DELIVERED`, `CANCELLED`).
3. **Category Management:** Create and organize categories for seamless navigation.

---

## Part 2: Software Requirements Specification (SRS)

### 1. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (TypeScript)              │
│                 Hosted on Vercel Edge                   │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API / JSON
┌───────────────────────────▼─────────────────────────────┐
│              NestJS Backend (TypeScript)                │
│             Hosted on Vercel Serverless                 │
└───────────────────────────┬─────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼─────────────────────────────┐
│              PostgreSQL Database (Neon)                 │
└─────────────────────────────────────────────────────────┘
```

* **Frontend:** Next.js 14+ (TypeScript), Tailwind CSS.
* **Backend:** NestJS (TypeScript) with Modular MVC architecture.
* **ORM & Database:** Prisma ORM connected to Neon Serverless PostgreSQL.
* **Deployment Platform:** Vercel (Frontend & Serverless API functions).
* **Development Tools:** VS Code with Puku CLI automation support.

---

### 2. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  COD
  BKASH
  NAGAD
}

enum PaymentStatus {
  UNPAID
  VERIFYING
  PAID
  FAILED
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  phone     String?
  role      Role     @default(USER)
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Category {
  id       String    @id @default(uuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model Product {
  id          String      @id @default(uuid())
  name        String
  description String
  price       Float
  stock       Int
  imageUrl    String?
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Order {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  totalAmount   Float
  shippingAddr  String
  paymentMethod PaymentMethod
  paymentStatus PaymentStatus @default(UNPAID)
  senderNumber  String?
  trxId         String?
  status        OrderStatus   @default(PENDING)
  items         OrderItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float
}
```

---

### 3. Core Implementation Snippets

#### 3.1 Merchant Payment Endpoint (`src/payment/payment.controller.ts`)
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/payment')
export class PaymentController {
  @Get('merchant-details')
  getMerchantDetails() {
    return {
      bkashNumber: '01735262232',
      nagadNumber: '01735262232',
      accountType: 'Personal / Send Money',
      instructions: 'Send money to 01735262232 and submit your mobile number and TrxID at checkout.',
    };
  }
}
```

#### 3.2 Admin Product Controller (`src/admin/admin-product.controller.ts`)
```typescript
import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CreateProductDto } from '../product/dto/create-product.dto';

@Controller('api/v1/admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Delete(':id')
  async removeProduct(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
```

#### 3.3 Universal Footer Component (`components/Footer.tsx`)
```tsx
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-2">Green Corner</h3>
          <p className="text-emerald-200 text-sm">
            Your trusted online plant and gardening supplies shop in Bangladesh.
          </p>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-2">Payment Numbers</h4>
          <p className="text-sm">bKash: <span className="font-mono text-emerald-300">01735262232</span></p>
          <p className="text-sm">Nagad: <span className="font-mono text-emerald-300">01735262232</span></p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Contact & Address</h4>
          <p className="text-sm">📍 Kuril Bisso Road, Dhaka, Bangladesh</p>
          <p className="text-sm">📞 Phone: <a href="tel:01735262232" className="hover:underline">01735262232</a></p>
          <p className="text-sm">✉️ Email: <a href="mailto:suraiyazahid085@gmail.com" className="hover:underline">suraiyazahid085@gmail.com</a></p>
        </div>
      </div>
      
      <div className="border-t border-emerald-800 mt-8 pt-4 text-center text-xs text-emerald-400">
        &copy; {new Date().getFullYear()} Green Corner. All rights reserved.
      </div>
    </footer>
  );
};
```

---

## Part 3: Deployment & Setup Guide

### 1. Database Provisioning (Neon)
1. Register on [Neon.tech](https://neon.tech) and create a PostgreSQL database named `green_corner`.
2. Retrieve your connection string (`DATABASE_URL`).

### 2. Environment Variables Configuration (`.env`)
```env
DATABASE_URL="postgresql://user:password@ep-cool-db.neon.tech/green_corner?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 3. Database Migration & Prisma Generation
```bash
npx prisma migrate dev --name init_green_corner
npx prisma generate
```

### 4. Vercel Deployment Commands
```bash
# Frontend & Backend deployment via Vercel CLI
vercel --prod
```