import { gql } from '@apollo/client';

// Queries - Compatible with food-delivery-api

// Get rider's active ride (sync on refresh)
export const GET_ACTIVE_RIDER_RIDE = gql`
  query GetActiveRiderRide {
    activeRiderRide {
      id
      rideId
      userId
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
      user {
        displayName
        phoneNumber
        photoURL
      }
      rider {
        id
        displayName
        phoneNumber
        photoURL
      }
      createdAt
      updatedAt
    }
  }
`;

// Get available rides for riders (unassigned rides)
export const GET_AVAILABLE_RIDES = gql`
  query GetAvailableRides {
    availableRides {
      id
      rideId
      userId
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
      rider {
        id
        displayName
        phoneNumber
        photoURL
      }
      createdAt
      updatedAt
    }
  }
`;

// Get specific ride details
export const GET_RIDE = gql`
  query GetRide($id: ID!) {
    ride(id: $id) {
      id
      rideId
      userId
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
      user {
        displayName
        phoneNumber
        photoURL
      }
      rider {
        id
        displayName
        phoneNumber
        photoURL
      }
      createdAt
      updatedAt
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
      userId
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
      updatedAt
    }
  }
`;

// Update ride status (ACCEPTED, ARRIVED_AT_PICKUP, PICKED_UP, ARRIVED_AT_DROPOFF, COMPLETED)
export const UPDATE_RIDE_STATUS = gql`
  mutation UpdateRideStatus($rideId: ID!, $status: String!, $confirmCode: String) {
    updateRideStatus(rideId: $rideId, status: $status, confirmCode: $confirmCode) {
      id
      rideId
      status
      updatedAt
    }
  }
`;

export const GET_RIDER_HISTORY = gql`
  query GetRiderHistory {
    riderRides {
      id
      rideId
      status
      pickupAddress
      dropoffAddress
      fare
      rating
      createdAt
      updatedAt
    }
  }
`;

// Get rider earnings for a specific period
export const GET_RIDER_EARNINGS = gql`
  query GetRiderEarnings($periodDays: Int) {
    riderEarnings(periodDays: $periodDays) {
      totalEarnings
      totalRides
      averagePerRide
      rides {
        id
        rideId
        pickupAddress
        dropoffAddress
        fare
        rating
        createdAt
        updatedAt
      }
    }
  }
`;
