import { gql } from '@apollo/client';

// Queries - Compatible with food-delivery-api

// Get available rides for riders (unassigned rides)
export const GET_AVAILABLE_RIDES = gql`
  query GetAvailableRides {
    availableRides {
      id
      rideId
      customerId
      riderId
      status
      pickupAddress
      pickupLat
      pickupLng
      dropoffAddress
      dropoffLat
      dropoffLng
      fare
      distance
      duration
      paymentMethod
      deliveryCode
      rating
      feedback
      createdAt
      updatedAt
    }
  }
`;

// Get available orders for riders (unassigned orders)
export const GET_AVAILABLE_ORDERS = gql`
  query GetAvailableOrders {
    availableOrders {
      id
      orderId
      userId
      restaurant
      orderItems {
        title
        food
        description
        quantity
        price
        total
      }
      orderAmount
      paidAmount
      paymentMethod
      orderStatus
      orderDate
      expectedTime
      isPickedUp
      riderId
      pickupCode
      paymentProcessed
      deliveryCharges
      tipping
      taxationAmount
      address
      instructions
      statusHistory {
        status
        timestamp
        note
      }
      createdAt
      updatedAt
    }
  }
`;

// Get specific order for rider (only accessible to assigned rider)
export const GET_RIDER_ORDER = gql`
  query GetRiderOrder($id: ID!) {
    riderOrder(id: $id) {
      id
      orderId
      userId
      restaurant
      orderItems {
        title
        food
        description
        quantity
        price
        total
      }
      orderAmount
      paidAmount
      paymentMethod
      orderStatus
      orderDate
      expectedTime
      isPickedUp
      riderId
      pickupCode
      paymentProcessed
      deliveryCharges
      tipping
      taxationAmount
      address
      instructions
      statusHistory {
        status
        timestamp
        note
      }
      createdAt
      updatedAt
    }
  }
`;

// Get current user profile
export const GET_ME = gql`
  query GetMe {
    me {
      id
      uid
      email
      displayName
      phoneNumber
      photoURL
      addresses {
        id
        label
        street
        city
        state
        isDefault
      }
      createdAt
    }
  }
`;

// Mutations - Compatible with food-delivery-api

// Accept a ride (assign rider to ride)
export const ACCEPT_RIDE = gql`
  mutation AcceptRide($rideId: ID!) {
    acceptRide(rideId: $rideId) {
      id
      rideId
      customerId
      riderId
      status
      pickupAddress
      pickupLat
      pickupLng
      dropoffAddress
      dropoffLat
      dropoffLng
      fare
      distance
      duration
      createdAt
    }
  }
`;

// Update ride status
export const UPDATE_RIDE_STATUS = gql`
  mutation UpdateRideStatus($rideId: ID!, $status: String!) {
    updateRideStatus(rideId: $rideId, status: $status) {
      id
      rideId
      status
      updatedAt
    }
  }
`;

// Assign rider to an order
export const ASSIGN_RIDER = gql`
  mutation AssignRider($orderId: ID!) {
    assignRider(orderId: $orderId) {
      id
      orderId
      userId
      restaurant
      orderItems {
        title
        food
        quantity
        price
        total
      }
      orderAmount
      paidAmount
      paymentMethod
      orderStatus
      orderDate
      expectedTime
      isPickedUp
      riderId
      pickupCode
      paymentProcessed
      address
      statusHistory {
        status
        timestamp
        note
      }
      createdAt
      updatedAt
    }
  }
`;

// Rider updates order status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
export const RIDER_UPDATE_ORDER_STATUS = gql`
  mutation RiderUpdateOrderStatus($orderId: ID!, $status: String!, $code: String) {
    riderUpdateOrderStatus(orderId: $orderId, status: $status, code: $code) {
      id
      orderId
      orderStatus
      isPickedUp
      paymentProcessed
      statusHistory {
        status
        timestamp
        note
      }
      updatedAt
    }
  }
`;

// Rider reports order not ready after waiting
export const RIDER_REPORT_NOT_READY = gql`
  mutation RiderReportNotReady($orderId: ID!, $waitedMinutes: Int) {
    riderReportNotReady(orderId: $orderId, waitedMinutes: $waitedMinutes)
  }
`;

// Rider cancels order after excessive delay
export const RIDER_CANCEL_ORDER = gql`
  mutation RiderCancelOrder($orderId: ID!, $reason: String) {
    riderCancelOrder(orderId: $orderId, reason: $reason)
  }
`;

// Update order status (generic - for restaurant/user)
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!, $note: String) {
    updateOrderStatus(orderId: $orderId, status: $status, note: $note) {
      id
      orderId
      orderStatus
      statusHistory {
        status
        timestamp
        note
      }
      updatedAt
    }
  }
`;
