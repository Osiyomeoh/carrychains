// src/services/ai/PricingOptimizationService.ts
interface PricingData {
    [route: string]: {
      basePrice: number;
      seasonalFactors: { [month: string]: number };
      demandMultiplier: number;
    }
  }
  
  export class PricingOptimizationService {
    // Sample pricing data - you can expand this with more routes
    private pricingData: PricingData = {
      "Lagos-Accra": {
        basePrice: 5.0,
        seasonalFactors: {
          "1": 1.2, // January
          "2": 1.1, 
          "3": 1.0,
          "4": 0.9,
          "5": 0.9,
          "6": 1.0,
          "7": 1.1,
          "8": 1.1,
          "9": 1.0,
          "10": 1.0,
          "11": 1.1,
          "12": 1.5 // December (holiday season)
        },
        demandMultiplier: 1.3
      },
      "Accra-Lagos": {
        basePrice: 5.2,
        seasonalFactors: {
          "1": 1.1,
          "6": 0.9,
          "12": 1.4
        },
        demandMultiplier: 1.2
      },
      // Add more routes that are relevant to your initial market
    };
    
    private getRouteKey(origin: string, destination: string): string {
      // Normalize inputs
      const normalizedOrigin = origin.trim().toLowerCase();
      const normalizedDestination = destination.trim().toLowerCase();
      
      // Try exact match first
      const exactKey = `${normalizedOrigin}-${normalizedDestination}`;
      if (this.pricingData[exactKey]) {
        return exactKey;
      }
      
      // Try case-insensitive match
      const routes = Object.keys(this.pricingData);
      const matchedRoute = routes.find(route => {
        const [routeOrigin, routeDest] = route.split('-').map(part => part.toLowerCase());
        return (routeOrigin.includes(normalizedOrigin) || normalizedOrigin.includes(routeOrigin)) &&
               (routeDest.includes(normalizedDestination) || normalizedDestination.includes(routeDest));
      });
      
      return matchedRoute || "default";
    }
    
    async getOptimizedPricing(
      origin: string,
      destination: string,
      travelDate: Date,
      availableWeight: number
    ): Promise<{
      recommendedPricePerKg: number;
      priceRange: { min: number; max: number };
      confidence: number;
      marketInsights: string[];
    }> {
      const routeKey = this.getRouteKey(origin, destination);
      
      // Use default values if route not found
      const routeData = this.pricingData[routeKey] || {
        basePrice: 4.0,
        seasonalFactors: {},
        demandMultiplier: 1.0
      };
      
      // Apply pricing factors
      const month = (travelDate.getMonth() + 1).toString();
      const seasonalFactor = routeData.seasonalFactors[month] || 1.0;
      
      // Weight factor - larger capacity gets discount
      const weightFactor = this.calculateWeightFactor(availableWeight);
      
      // Calculate recommended price
      const recommendedPrice = routeData.basePrice * seasonalFactor * 
                               routeData.demandMultiplier * weightFactor;
      
      // Set price range (narrower range = higher confidence)
      const minPrice = recommendedPrice * 0.85;
      const maxPrice = recommendedPrice * 1.15;
      
      // Generate insights
      const insights = this.generateInsights(seasonalFactor, weightFactor, month);
      
      // Calculate confidence (higher for known routes, lower for default/approximated routes)
      const confidence = routeKey !== "default" ? 0.85 : 0.6;
      
      return {
        recommendedPricePerKg: parseFloat(recommendedPrice.toFixed(2)),
        priceRange: { 
          min: parseFloat(minPrice.toFixed(2)), 
          max: parseFloat(maxPrice.toFixed(2)) 
        },
        confidence,
        marketInsights: insights
      };
    }
    
    private calculateWeightFactor(weight: number): number {
      if (weight > 15) return 0.85; // Large discount for significant space
      if (weight > 10) return 0.9;
      if (weight > 5) return 0.95;
      return 1.0;
    }
    
    private generateInsights(seasonalFactor: number, weightFactor: number, month: string): string[] {
      const insights = [];
      
      // Seasonal insights
      if (seasonalFactor > 1.2) {
        insights.push("High demand season - prices are higher than average.");
      } else if (seasonalFactor < 0.9) {
        insights.push("Low season - reduced pricing recommended to attract customers.");
      }
      
      // Holiday season specific
      if (month === "12") {
        insights.push("Holiday season increases demand for shipping services.");
      }
      
      // Weight insights
      if (weightFactor < 0.9) {
        insights.push("Volume discount applied for large capacity offering.");
      }
      
      return insights;
    }
  }