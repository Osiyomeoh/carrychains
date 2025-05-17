// src/pages/AIInsightsPage.tsx
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { useAI } from '../contexts/AIContext';

const AIInsightsPage: React.FC = () => {
  const { account } = useWeb3();
  const { state: { routes, deliveries } } = useAppData();
  const { pricingService, routeMatchingService } = useAI();
  
  const [loading, setLoading] = useState(true);
  const [pricingInsights, setPricingInsights] = useState<any[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  
  useEffect(() => {
    const generateInsights = async () => {
      setLoading(true);
      
      try {
        // Generate pricing insights for top routes
        const routeInsights = await Promise.all(
          routes.slice(0, 5).map(async (route) => {
            const recommendation = await pricingService.getOptimizedPricing(
              route.departureLocation,
              route.destinationLocation,
              new Date(route.departureTime * 1000),
              route.availableSpace
            );
            
            return {
              route,
              currentPrice: route.pricePerKg,
              recommendedPrice: recommendation.recommendedPricePerKg,
              priceGap: (route.pricePerKg - recommendation.recommendedPricePerKg).toFixed(2),
              insights: recommendation.marketInsights
            };
          })
        );
        
        setPricingInsights(routeInsights);
        
        // Generate popular routes analysis
        const routeStats = routes.reduce((acc, route) => {
          const key = `${route.departureLocation}-${route.destinationLocation}`;
          if (!acc[key]) {
            acc[key] = {
              origin: route.departureLocation,
              destination: route.destinationLocation,
              count: 0,
              avgPrice: 0,
              totalWeight: 0
            };
          }
          
          acc[key].count += 1;
          acc[key].avgPrice += route.pricePerKg;
          acc[key].totalWeight += route.availableSpace;
          
          return acc;
        }, {} as Record<string, any>);
        
        // Calculate averages and sort by popularity
        const routeAnalysis = Object.values(routeStats)
          .map(stats => ({
            ...stats,
            avgPrice: (stats.avgPrice / stats.count).toFixed(2),
            avgWeight: (stats.totalWeight / stats.count).toFixed(1)
          }))
          .sort((a, b) => b.count - a.count);
        
        setPopularRoutes(routeAnalysis.slice(0, 5));
      } catch (error) {
        console.error("Failed to generate insights:", error);
      } finally {
        setLoading(false);
        setLoadingChart(false);
      }
    };
    
    if (routes.length > 0) {
      generateInsights();
    }
  }, [routes]);
  
  return (
    <div className="ai-insights-page bg-gray-900 text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <span className="mr-3">✨</span>
        AI Insights Dashboard
      </h1>
      
      {loading ? (
        <div className="bg-gray-800 rounded-lg p-12 flex justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl">Generating AI insights...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Price Optimization Insights */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Price Optimization Analysis</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recommended</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gap</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Insights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pricingInsights.map((insight, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {insight.route.departureLocation} → {insight.route.destinationLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${insight.currentPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${insight.recommendedPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={
                          parseFloat(insight.priceGap) > 0 
                            ? 'text-red-400' 
                            : parseFloat(insight.priceGap) < 0 
                              ? 'text-green-400' 
                              : ''
                        }>
                          {parseFloat(insight.priceGap) > 0 ? '+' : ''}{insight.priceGap}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="text-sm list-disc pl-4">
                          {insight.insights.map((text: string, i: number) => (
                            <li key={i}>{text}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Popular Routes Analysis */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Popular Routes Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart (placeholder) */}
              <div className="bg-gray-750 rounded-lg p-4 h-64 flex items-center justify-center">
                {loadingChart ? (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p>Loading chart...</p>
                  </div>
                ) : (
                  <p className="text-gray-400">
                    Route popularity chart would go here.
                    <br />
                    (For actual implementation, use recharts or another library)
                  </p>
                )}
              </div>
              
              {/* Route list */}
              <div>
                <h3 className="text-lg font-medium mb-3">Top 5 Popular Routes</h3>
                <div className="space-y-3">
                  {popularRoutes.map((route, index) => (
                    <div key={index} className="bg-gray-750 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{route.origin} → {route.destination}</span>
                        <span className="bg-blue-900/60 px-2 py-1 rounded-full text-xs">
                          {route.count} trips
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1 flex space-x-4">
                        <span>Avg: ${route.avgPrice}/kg</span>
                        <span>Typical capacity: {route.avgWeight}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPage;