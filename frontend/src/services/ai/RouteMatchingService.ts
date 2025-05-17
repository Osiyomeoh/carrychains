// src/services/ai/RouteMatchingService.ts
import { TravelRoute } from '../../types';

export class RouteMatchingService {
  /**
   * Find optimal routes based on package details and user preferences
   */
  async findOptimalRoutes(
    origin: string,
    destination: string,
    packageDetails: {
      weight: number;
      dimensions?: { length: number; width: number; height: number };
      value?: number;
      urgency: 'low' | 'medium' | 'high';
    },
    userPreferences: {
      maxPrice?: number;
      earliestDeparture?: Date;
      latestArrival?: Date;
      travelerRating?: number;
    },
    availableRoutes: TravelRoute[]
  ): Promise<{
    routes: TravelRoute[];
    bestMatch?: TravelRoute;
    matchExplanation: string[];
  }> {
    // Create scoring function for routes
    const scoreRoute = (route: TravelRoute): { score: number; penaltyReasons: string[]; bonusReasons: string[] } => {
      let score = 100; // Base score
      let penaltyReasons: string[] = [];
      let bonusReasons: string[] = [];
      
      // Location matching (exact match is best)
      const normalizedOrigin = origin.toLowerCase().trim();
      const normalizedDestination = destination.toLowerCase().trim();
      const routeOrigin = route.departureLocation.toLowerCase().trim();
      const routeDestination = route.destinationLocation.toLowerCase().trim();
      
      if (routeOrigin !== normalizedOrigin) {
        score -= 20;
        penaltyReasons.push("Origin location doesn't match exactly");
      } else {
        bonusReasons.push("Origin location matches exactly");
      }
      
      if (routeDestination !== normalizedDestination) {
        score -= 20;
        penaltyReasons.push("Destination location doesn't match exactly");
      } else {
        bonusReasons.push("Destination location matches exactly");
      }
      
      // Price preference
      if (userPreferences.maxPrice && route.pricePerKg > userPreferences.maxPrice) {
        const priceDifference = route.pricePerKg - userPreferences.maxPrice;
        const percentageOver = (priceDifference / userPreferences.maxPrice) * 100;
        
        if (percentageOver > 50) {
          score -= 30;
          penaltyReasons.push(`Price is ${Math.round(percentageOver)}% over your maximum`);
        } else if (percentageOver > 20) {
          score -= 20;
          penaltyReasons.push(`Price is ${Math.round(percentageOver)}% over your maximum`);
        } else {
          score -= 10;
          penaltyReasons.push(`Price is slightly over your maximum`);
        }
      } else if (userPreferences.maxPrice) {
        bonusReasons.push("Price is within your budget");
        
        // Bonus for being well under budget
        if (route.pricePerKg < userPreferences.maxPrice * 0.7) {
          score += 10;
          bonusReasons.push("Price is significantly below your maximum");
        }
      }
      
      // Date preferences
      const routeDeparture = new Date(route.departureTime * 1000);
      const routeArrival = new Date(route.arrivalTime * 1000);
      
      if (userPreferences.earliestDeparture && routeDeparture < userPreferences.earliestDeparture) {
        score -= 15;
        penaltyReasons.push("Departs earlier than your preferred date");
      }
      
      if (userPreferences.latestArrival && routeArrival > userPreferences.latestArrival) {
        // src/services/ai/RouteMatchingService.ts (continued)
        score -= 15;
        penaltyReasons.push("Arrives later than your preferred date");
      }
      
      // Urgency factor
      if (packageDetails.urgency === 'high') {
        // For high urgency, faster delivery gets higher score
        const travelDuration = (routeArrival.getTime() - routeDeparture.getTime()) / (1000 * 60 * 60); // in hours
        if (travelDuration > 72) {
          score -= 25;
          penaltyReasons.push("Travel time too long for high urgency package");
        } else if (travelDuration < 24) {
          score += 15;
          bonusReasons.push("Quick delivery matches your high urgency need");
        }
      }
      
      // Weight capacity
      if (route.availableSpace < packageDetails.weight) {
        score = 0; // Disqualify routes with insufficient capacity
        penaltyReasons.push("Insufficient weight capacity for your package");
      } else if (route.availableSpace >= packageDetails.weight * 2) {
        score += 5;
        bonusReasons.push("Plenty of capacity for your package");
      }
      
      return { score, penaltyReasons, bonusReasons };
    };
    
    // Score each route
    const scoredRoutes = availableRoutes
      .map(route => {
        const result = scoreRoute(route);
        return { route, ...result };
      })
      .filter(item => item.score > 0) // Remove disqualified routes
      .sort((a, b) => b.score - a.score); // Sort by score descending
    
    // Find best match
    const bestMatch = scoredRoutes.length > 0 ? scoredRoutes[0].route : undefined;
    
    // Generate explanation
    let matchExplanation: string[] = [];
    
    if (scoredRoutes.length === 0) {
      matchExplanation.push("No matching routes found that meet your requirements.");
      matchExplanation.push("Try adjusting your search criteria or package details.");
    } else {
      const bestScore = scoredRoutes[0];
      
      matchExplanation.push(`Found ${scoredRoutes.length} routes matching your criteria.`);
      matchExplanation.push(`Best match score: ${bestScore.score}/100`);
      
      if (bestScore.bonusReasons.length > 0) {
        matchExplanation.push("Matching strengths:");
        bestScore.bonusReasons.forEach(reason => matchExplanation.push(`✓ ${reason}`));
      }
      
      if (bestScore.penaltyReasons.length > 0) {
        matchExplanation.push("Considerations:");
        bestScore.penaltyReasons.forEach(reason => matchExplanation.push(`! ${reason}`));
      }
    }
    
    return {
      routes: scoredRoutes.map(item => item.route),
      bestMatch,
      matchExplanation
    };
  }
}