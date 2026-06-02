# Worker Connect - Hyperlocal Service Marketplace

## Live Demo

https://workers-connect.netlify.app/

---

# Overview

Worker Connect is a full-stack hyperlocal service marketplace that connects customers with nearby skilled workers such as plumbers, electricians, painters, carpenters, and other service professionals.

The platform helps users quickly discover available workers in their area, request services, and receive real-time booking updates through an intuitive web interface.

Built specifically for local communities, Worker Connect aims to simplify the process of finding trusted service providers while creating more opportunities for skilled workers.

---

# Key Features

## User Booking System

* Book local service professionals
* View available workers
* Submit service requests
* Manage bookings

## Worker Registration

* Worker profile creation
* Service category selection
* Availability management
* Professional information tracking

## Location-Based Discovery

* Find workers near the user's location
* Hyperlocal service recommendations
* Faster worker discovery

## Real-Time Booking Updates

* Instant booking notifications
* Live status updates
* Real-time communication support using Socket.io

## Worker Profiles

* Professional information
* Service specialization
* Contact details
* Availability status

## Responsive User Experience

* Mobile-friendly interface
* Fast and intuitive navigation
* Optimized booking workflow

---

# Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Real-Time Communication

* Socket.io

---

# System Workflow

## Step 1: Worker Registration

Workers create profiles and specify:

* Skills
* Service categories
* Availability status
* Location details

## Step 2: User Search

Customers browse or search for nearby workers based on:

* Service type
* Availability
* Location

## Step 3: Booking Request

Users submit booking requests for required services.

## Step 4: Real-Time Updates

Workers receive booking notifications and status updates are synchronized using Socket.io.

## Step 5: Service Completion

The booking lifecycle is tracked until service completion.

---

# Core Modules

### Authentication Module

* User management
* Worker registration

### Worker Management Module

* Worker profiles
* Availability tracking
* Service categories

### Booking Module

* Service requests
* Booking management
* Status tracking

### Location Module

* Nearby worker discovery
* Location-based matching

### Real-Time Communication Module

* Live booking updates
* Instant notifications

---

# Installation & Setup

## Clone Repository

```bash
git clone https://github.com/yourusername/vizag-worker-connect.git
```

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

---

# Future Enhancements

* Integrated payment gateway
* Live worker tracking
* Worker verification and KYC system
* Ratings and reviews system
* Telugu language support
* Service chat functionality
* AI-powered worker recommendations
* Mobile application

---

# Use Cases

### For Customers

* Find nearby service professionals
* Book workers quickly
* Track service requests

### For Workers

* Increase local visibility
* Receive booking requests
* Manage service availability

---

# Author

## Thamarana Satya Durga Prasad

* GitHub: https://github.com/TSDPRASAD88
* LinkedIn: http://www.linkedin.com/in/satya-durga-prasad-thamarana-a65324326

---

# Final Note

Worker Connect was built to bridge the gap between customers and skilled service professionals through a location-aware platform that enables fast worker discovery, streamlined bookings, and real-time communication.
