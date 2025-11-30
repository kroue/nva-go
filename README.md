# NVAGo - Online Ordering and POS System

A mobile and web-based ordering system for NVA Printing Services that allows customers to order printing services online and enables staff to manage orders efficiently.

## About

NVAGo is our capstone project for BS Information Technology at the University of Science and Technology of Southern Philippines. It helps NVA Printing Services modernize their operations by allowing customers to:

- Order printing services online through a mobile app
- Chat directly with graphic designers
- Pay using GCash
- Track their orders in real-time

## Features

**For Customers:**
- Browse and order printing services
- Upload design files
- Chat with designers
- Pay with GCash
- Track order status
- Download receipts

**For Staff:**
- View and manage customer orders
- Validate payments
- Update order status
- Chat with customers
- Generate reports

**For Admins:**
- Manage users and products
- Monitor system activity
- Update pricing and services

## Technology Used

- **Mobile App:** React Native with Expo (Android)
- **Web Interface:** React
- **Database:** PostgreSQL (Supabase)
- **Payment:** GCash integration
- **Hosting:** Supabase

## Installation

### Clone Repository

Download the project code to your local machine:

```bash
git clone https://github.com/kroue/nva-go.git
cd nva-go
```

### Install Dependencies

Install all required packages and libraries for the project:

```bash
npm install
```

or if you're using yarn:

```bash
yarn install
```

### Setup Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Run the Application
Open the Integrated terminal first.

**For web interface:** 
```bash
npm run web
```

**For mobile app:**
```bash
npx expo start
```

Then scan the QR code with Expo Go app on your Android device.

## Team Members

- Kriz Marie P. Cultura
- Ariana Marie O. Palle
- Aljohn B. Arranguez
- Rodel T. Madrid

## Project Timeline

Expected Completion: May 2025

## Contact

Repository: [github.com/kroue/nva-go](https://github.com/kroue/nva-go)
