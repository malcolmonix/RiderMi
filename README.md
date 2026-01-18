# RiderMi - Rider Delivery Application

A fully functional rider/driver application similar to Uber or Bolt, built for the Food Delivery ecosystem. RiderMi enables riders to accept delivery orders, track deliveries with interactive Mapbox maps, and complete deliveries with real-time status updates.

## 🚀 Features

### ✅ Completed Features
- **Interactive Map**: Full Mapbox GL integration with bottom-sheet-aware centering for optimal UX
- **Ride Acceptance**: View and accept available ride requests
- **Live Location Sharing**: Automatic GPS location updates to Firestore for real-time tracking
- **Status Management**: Robust ride state management preventing stuck rides after completion
- **Online/Offline Toggle**: Control availability for receiving ride requests
- **Distance Calculation**: Shows distance to pickup/dropoff locations
- **Real-time Updates**: GraphQL polling with smart completion tracking
- **Authentication**: Email/password and Google Sign-In with Firebase Auth
- **Push Notifications**: FCM integration for new ride alerts
- **Chat System**: In-ride messaging with customers
- **Chat Notifications**: Toast notifications with message preview, sound alerts, and localStorage persistence
- **Earnings Dashboard**: Track daily, weekly, and monthly earnings
- **Ride History**: View completed and cancelled ride history
- **Profile Management**: Update rider info, vehicle details, and license plate

### 📱 Pages
- `/` - Main dashboard with map and available orders
- `/login` - Authentication (Email/Password & Google Sign-In)
- `/earnings` - Earnings tracking and transaction history
- `/history` - Completed order history
- `/profile` - Rider profile management

## 🛠 Tech Stack

- **Framework**: Next.js 16+ (React 19)
- **GraphQL Client**: Apollo Client 3
- **Authentication**: Firebase Auth
- **Real-time Database**: Firebase Firestore
- **Maps**: Mapbox GL JS (react-map-gl v7)
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks + Apollo cache
- **Push Notifications**: Firebase Cloud Messaging

## 📦 Installation

### Prerequisites
- Node.js 18+
- Firebase project configured
- Mapbox account with API token
- [food-delivery-api](https://github.com/malcolmonix/food-delivery-api) server running

### Setup

1. Clone the repository:
```bash
git clone https://github.com/malcolmonix/RiderMi.git
cd RiderMi
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

4. Start development server:
```bash
npm run dev
```

App runs on `http://localhost:3000`

## ⚙️ Environment Variables

Create `.env.local` file with the following:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# API Endpoint (food-delivery-api server)
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## 🔄 Delivery Flow

RiderMi integrates with the food-delivery-api and DeliverMi customer app:

```
Customer (DeliverMi) → API → Rider (RiderMi) → Customer (Tracking)
```

### Order Lifecycle:
1. **Go Online**: Rider toggles online status to receive orders
2. **View Orders**: Available orders appear on map and in list
3. **Accept Order**: Rider accepts order (Status: ASSIGNED)
4. **Navigate to Restaurant**: Use pickup code for verification
5. **Mark Picked Up**: Confirm order pickup (Status: PICKED_UP)
6. **Start Delivery**: Begin navigation to customer (Status: OUT_FOR_DELIVERY)
7. **Complete Delivery**: Enter delivery code to confirm (Status: DELIVERED)

## 📊 GraphQL Operations

### Queries (Compatible with food-delivery-api)
- `availableOrders` - Get unassigned orders for riders
- `riderOrder(id)` - Get specific order assigned to rider
- `me` - Get current user profile

### Mutations
- `assignRider(orderId)` - Accept/assign order to rider
- `riderUpdateOrderStatus(orderId, status, code)` - Update order status
- `riderReportNotReady(orderId, waitedMinutes)` - Report order not ready
- `riderCancelOrder(orderId, reason)` - Cancel order after delay

## 📁 Project Structure

```
ridermi/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ActiveOrderPanel.js   # Active order management
│   │   ├── BottomNav.js          # Navigation bar
│   │   ├── OrderCard.js          # Order list item
│   │   └── RiderMap.js           # Mapbox map component
│   ├── lib/                 # Configuration & utilities
│   │   ├── apollo.js            # Apollo Client setup
│   │   ├── firebase.js          # Firebase initialization
│   │   ├── graphql.js           # GraphQL queries/mutations
│   │   └── mapbox.js            # Mapbox utilities
│   ├── pages/               # Next.js pages
│   │   ├── _app.js              # App wrapper
│   │   ├── index.js             # Main dashboard
│   │   ├── login.js             # Authentication
│   │   ├── earnings.js          # Earnings page
│   │   ├── history.js           # Order history
│   │   └── profile.js           # Profile settings
│   └── styles/              # Global styles
│       └── globals.css          # Tailwind + custom CSS
├── public/                  # Static assets
│   └── firebase-messaging-sw.js # Push notification worker
├── .env.local.example       # Environment template
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind configuration
└── next.config.mjs          # Next.js configuration
```

## 🔗 Related Repositories

- [food-delivery-api](https://github.com/malcolmonix/food-delivery-api) - GraphQL API server
- [DeliverMi](https://github.com/malcolmonix/DeliverMi) - Customer app
- [ChopChop](https://github.com/malcolmonix/ChopChop) - Main food ordering platform
- [chopChopDocs](https://github.com/malcolmonix/chopChopDocs) - Documentation

## 🧪 Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 📄 License

Part of the ChopChop Food Delivery ecosystem.

## 🤝 Contributing

See the [food-delivery-api documentation](https://github.com/malcolmonix/food-delivery-api) for API integration details and development guidelines.
