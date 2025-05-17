// src/contexts/AIContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { 
  PricingOptimizationService,
  FraudDetectionService,
  PackageVerificationService,
  RouteMatchingService
} from '../services/ai';

interface AIContextType {
  pricingService: PricingOptimizationService;
  fraudDetectionService: FraudDetectionService;
  packageVerificationService: PackageVerificationService;
  routeMatchingService: RouteMatchingService;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize services
  const pricingService = new PricingOptimizationService();
  const fraudDetectionService = new FraudDetectionService();
  const packageVerificationService = new PackageVerificationService();
  const routeMatchingService = new RouteMatchingService();
  
  return (
    <AIContext.Provider value={{
      pricingService,
      fraudDetectionService,
      packageVerificationService,
      routeMatchingService
    }}>
      {children}
    </AIContext.Provider>
  );
};

// Custom hook for using the AI context
export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};