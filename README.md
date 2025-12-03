# RiderMi - Rider Application

Rider application for the Food Delivery & Ride Booking ecosystem. RiderMi enables riders to accept ride requests, share live location, and complete rides with interactive Mapbox maps.

## Features

### ✅ Completed Features
- **Interactive Map**: Mapbox GL integration showing rider location and available rides
- **Ride Acceptance**: View and accept available ride requests
- **Live Location Sharing**: Automatic location updates every 5 seconds
- **Route Preview**: Route visualization to pickup and dropoff locations
- **Status Management**: Update ride status (PICKED_UP, COMPLETED)
- **Online/Offline Toggle**: Control availability for ride requests
- **Distance Calculation**: Shows distance to pickup locations
- **Real-time Updates**: Polling for new ride requests
- **Authentication**: Email/password and Google sign-in

### 🚧 Planned Features
- Earnings dashboard
- Ride history
- Push notifications
- Performance metrics

## Tech Stack

- **Framework**: Next.js 16+
- **GraphQL Client**: Apollo Client
- **Authentication**: Firebase Auth
- **Real-time**: Firebase Firestore
- **Maps**: Mapbox GL JS (react-map-gl)
- **Styling**: Tailwind CSS
- **State**: React hooks + Apollo cache

## Setup

### Prerequisites
- Node.js 18+
- Firebase project configured
- Mapbox account with API token
- API server running on port 4000

### Installation

```bash
cd ridermi
npm install
```

### Environment Variables

Create `.env.local` file:

```env
# Firebase Config (must match other apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Endpoint
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFsY29sbW9uaXgiLCJhIjoiY21pbmM2dnk3MTcydjNmczVsMnA1N3RlbyJ9.ZcElr4lOdzhEywm-570cCg
```

### Development

```bash
npm run dev
```

App runs on `http://localhost:3000` (or configured port)

## Ride Flow

RiderMi enables riders to accept and complete rides:

```
DeliverMi (Customer) → API → RiderMi (Rider) → DeliverMi (Tracking)
```

1. **RiderMi**: Rider goes online
2. **API**: Sends available ride requests
3. **RiderMi**: Rider sees rides on map and in list
4. **RiderMi**: Rider accepts ride (Status: ACCEPTED)
5. **RiderMi**: Rider shares location every 5 seconds
6. **DeliverMi**: Customer tracks rider in real-time
7. **RiderMi**: Rider marks picked up (Status: PICKED_UP)
8. **RiderMi**: Rider completes ride (Status: COMPLETED)

## Key Pages

- `/` - Dashboard with map and available rides
- `/login` - Authentication (Email/Password & Google Sign-In)

## GraphQL Operations

### Queries
- `availableRides` - Get all REQUESTED status rides
- `myRides` - Get rider's ride history
- `ride(id)` - Get specific ride details

### Mutations
- `acceptRide(rideId)` - Accept a ride request
- `updateRideStatus(rideId, status)` - Update ride status
- `updateRiderLocation(latitude, longitude)` - Share live location

## Testing

See `Docs/05-Testing/DELIVERMI-RIDERMI-TEST-PLAN.md` for complete test procedures.

## Project Structure

```
ridermi/
├── src/
│   ├── components/     # Reusable components
│   ├── lib/           # Apollo + Firebase + Mapbox config
│   ├── pages/         # Next.js pages
│   └── styles/        # Global styles
├── public/            # Static assets
└── .env.local         # Environment config
```

## Contributing

Part of the Food Delivery & Ride Booking ecosystem. See root `.github/copilot-instructions.md` and `Docs/06-Development/` for development guidelines.
