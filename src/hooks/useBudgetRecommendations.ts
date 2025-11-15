import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BudgetRecommendations {
  recommendedValues: Record<string, number>;
  varianceThreshold: number;
  insights: string[];
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    seasonality: 'high' | 'medium' | 'low' | 'none';
    predictability: 'high' | 'medium' | 'low';
  };
  riskFactors: string[];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

interface RecommendationResult {
  success: boolean;
  reportType: string;
  rigCode: string;
  dataPoints: number;
  recommendations: BudgetRecommendations;
}

export function useBudgetRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  const generateRecommendations = async (reportType: string, rigCode?: string) => {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const { data, error } = await supabase.functions.invoke('budget-recommendations', {
        body: { reportType, rigCode }
      });

      if (error) {
        if (error.message.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message.includes('credits exhausted')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          toast.error(`Failed to generate recommendations: ${error.message}`);
        }
        throw error;
      }

      if (!data.success) {
        throw new Error('Failed to generate recommendations');
      }

      setRecommendations(data);
      toast.success('Budget recommendations generated successfully');
      return data;

    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    recommendations,
    generateRecommendations,
    clearRecommendations: () => setRecommendations(null),
  };
}
