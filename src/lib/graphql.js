import { gql } from '@apollo/client';

// Queries - Compatible with food-delivery-api

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
  mutation UpdateRideStatus($rideId: ID!, $status: String!) {
    updateRideStatus(rideId: $rideId, status: $status) {
      id
      rideId
      status
      updatedAt
    }
  }
`;
