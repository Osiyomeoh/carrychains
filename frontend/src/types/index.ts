// Marketplace types
export enum DeliveryStatus {
  Created = 0,
  Accepted = 1,
  PickedUp = 2,
  Delivered = 3,
  Completed = 4,
  Cancelled = 5,
  Disputed = 6
}

export interface TravelRoute {
  id: number;
  traveler: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: number;
  arrivalTime: number;
  availableSpace: number; // in grams
  pricePerKg: number; // in smallest unit of stablecoin
  isActive: boolean;
}

export interface Delivery {
  id: number;
  routeId: number;
  traveler: string;
  shipper: string;
  packageDescription: string;
  packageWeight: number; // in grams
  totalPrice: number;
  status: DeliveryStatus;
  createdAt: number;
  disputed: boolean;
}

export interface Verification {
  deliveryId: number;
  pickupProofCID: string;
  pickupTimestamp: number;
  deliveryProofCID: string;
  deliveryTimestamp: number;
  isVerified: boolean;
  pickupProofURL: string;
  deliveryProofURL: string;
}

export interface StablecoinInfo {
  isSupported: boolean;
  decimals: number;
  symbol: string;
}

// UI-specific types
export interface RouteFormData {
  departureLocation: string;
  destinationLocation: string;
  departureTime: Date;
  arrivalTime: Date;
  availableSpace: number;
  pricePerKg: number;
}

export interface DeliveryFormData {
  routeId: number;
  packageDescription: string;
  packageWeight: number;
}

export interface VerificationFormData {
  deliveryId: number;
  proofImage: File | null;
}

export interface UserProfile {
  address: string;
  positiveReviews: number;
  totalReviews: number;
  reputationScore: number;
}

// State management types
export interface AppState {
  routes: TravelRoute[];
  myRoutes: TravelRoute[];
  deliveries: Delivery[];
  myDeliveries: {
    asShipper: Delivery[];
    asTraveler: Delivery[];
  };
  verifications: Record<number, Verification>;
  userProfiles: Record<string, UserProfile>;
  loadingProgress: {
    current: number;
    total: number;
    routesFound: number;
  } | null;
}

// Web3Context types
export interface Web3ContextType {
  account: string | null;
  provider: any; // Using any for now to avoid complex ethers types
  signer: any; // Using any for now to avoid complex ethers types
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  error: string | null;
}

// AppDataContext types
export interface AppDataContextType {
  state: AppState;
  
  // Loading state data
  loadRoutes: () => Promise<void>;
  loadMyRoutes: () => Promise<void>;
  loadDeliveries: () => Promise<void>;
  loadMyDeliveries: () => Promise<void>;
  loadVerification: (deliveryId: number) => Promise<any>; // Changed return type to any from void
  loadUserProfile: (address: string) => Promise<void>;
  
  // Route management
  createRoute: (
    departureLocation: string,
    destinationLocation: string,
    departureTime: number,
    arrivalTime: number,
    availableSpace: number,
    pricePerKg: number
  ) => Promise<boolean>;
  updateRouteStatus: (routeId: number, isActive: boolean) => Promise<boolean>;
  
  // Delivery management
  createDelivery: (
    routeId: number,
    packageDescription: string,
    packageWeight: number
  ) => Promise<boolean>;
  acceptDelivery: (deliveryId: number) => Promise<boolean>;
  
  // Verification and status updates
  confirmPickup: (deliveryId: number, proofFile: File) => Promise<boolean>;
  confirmDelivery: (deliveryId: number, proofFile: File) => Promise<boolean>;
  completeDelivery: (deliveryId: number) => Promise<boolean>;
  
  // Direct contract interactions
  updateDeliveryStatus: (deliveryId: number, newStatus: number) => Promise<boolean>;
  recordVerification: (deliveryId: number, proofCID: string, isPickup: boolean) => Promise<boolean>;
  
  // Feedback and reputation
  submitReview: (address: string, isPositive: boolean) => Promise<boolean>;
  
  // Pinata/IPFS utilities
  uploadProofToIPFS: (file: File) => Promise<string>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}