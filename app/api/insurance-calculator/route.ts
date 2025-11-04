// this file is app/api/insurance-calculator/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { income, familySize, state, hasEmployerInsurance } = await req.json();

        // Simple cost estimation logic (in real app, use actual insurance APIs)
        const calculateCostEstimate = () => {
            let basePremium = 300; // Base monthly premium
            
            // Adjust based on family size
            if (familySize > 1) {
                basePremium += (familySize - 1) * 200;
            }
            
            // Income-based adjustments (simplified)
            if (income < 30000) basePremium *= 0.7;
            else if (income > 100000) basePremium *= 1.3;
            
            // Employer insurance adjustment
            if (hasEmployerInsurance) basePremium *= 0.5;
            
            return {
                monthlyPremium: Math.round(basePremium),
                estimatedDeductible: familySize * 1000,
                estimatedOutOfPocketMax: familySize * 7000,
                notes: [
                    "Estimates vary by provider and location",
                    "Actual costs depend on specific plan details",
                    "Subsidies may be available based on income"
                ]
            };
        };

        const estimate = calculateCostEstimate();

        return NextResponse.json({
            type: 'cost_estimate',
            estimate: estimate,
            disclaimer: "This is a rough estimate. Actual costs vary by provider, location, and specific plan details.",
            nextSteps: [
                "Compare plans on healthcare.gov or your state marketplace",
                "Consult with a licensed insurance broker",
                "Check employer-sponsored options if available"
            ]
        });

    } catch (error: any) {
        console.error('Insurance calculator error:', error);
        return NextResponse.json(
            { error: "Failed to calculate insurance estimate" },
            { status: 500 }
        );
    }
}