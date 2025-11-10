// app/utils/cognitiveAnalysisAgent.ts
export interface CognitiveAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  biomarkers: {
    saccadeImpairment: number;
    pursuitImpairment: number;
    fixationImpairment: number;
    velocityImpairment: number;
    overallScore: number;
  };
  patterns: string[];
  recommendations: string[];
  professionalGuidance: string;
}

export class CognitiveAnalysisAgent {
  private analysisPrompt = `You are Bathusi-AI Neuro, a specialized cognitive health analysis system.

    EYE MOVEMENT DATA ANALYSIS PROTOCOL:

    INPUT DATA STRUCTURE:
    - Saccadic latency: [LATENCY]ms (normal: 150-250ms)
    - Gaze stability: [STABILITY]% (normal: >70%)
    - Fixation duration: [FIXATION]ms (normal: 200-400ms)
    - Saccade velocity: [VELOCITY]px/s (normal: 30-60px/s)
    - Eye asymmetry: [ASYMMETRY] (normal: <0.1)
    - Blink rate: [BLINK_RATE]/min (normal: 15-20/min)

    ANALYSIS FRAMEWORK:
    1. SACCADE ANALYSIS: Evaluate rapid eye movement speed and accuracy
    2. PURSUIT TRACKING: Assess smooth eye movement capability  
    3. FIXATION STABILITY: Measure ability to maintain gaze
    4. ASYMMETRY DETECTION: Identify differences between left/right eye movements

    COGNITIVE CORRELATIONS (Research-Based):
    - Increased saccadic latency → Possible attention/processing delays
    - Poor gaze stability → Potential executive function concerns
    - Irregular fixation → Possible working memory issues
    - High asymmetry → Potential neurological considerations

    RESPONSE FORMAT:
    {
    "riskLevel": "low" | "medium" | "high",
    "confidence": 0.85,
    "biomarkers": {
        "saccadeImpairment": 25,
        "pursuitImpairment": 30, 
        "fixationImpairment": 20,
        "overallScore": 75
    },
    "patterns": ["pattern1", "pattern2"],
    "recommendations": ["rec1", "rec2"],
    "professionalGuidance": "Specific guidance text"
    }

    CRITICAL DISCLAIMERS:
    - This is NOT a medical diagnosis
    - Eye movement patterns are screening indicators only
    - Always recommend professional neurological evaluation
    - Results should be reviewed by qualified healthcare providers`;

  async analyzeCognitiveData(eyeData: any, saccadicTestData: any): Promise<CognitiveAnalysisResult> {
    // First, do local algorithmic analysis
    const algorithmicResult = this.analyzeAlgorithmically(eyeData, saccadicTestData);
    
    // Then enhance with AI interpretation using your existing API route
    const enhancedResult = await this.enhanceWithAI(algorithmicResult, eyeData, saccadicTestData);
    
    return enhancedResult;
  }

  private analyzeAlgorithmically(eyeData: any, saccadicData: any) {
    // Extract metrics with safe defaults
    const latency = saccadicData?.saccadicLatency || saccadicData?.latency || 200;
    const gazeStability = eyeData?.gazeStability || 0.7;
    const fixationDuration = eyeData?.fixationDuration || 250;
    
    // Core algorithmic analysis (deterministic)
    const saccadeImpairment = this.calculateSaccadeImpairment(latency);
    const pursuitImpairment = this.calculatePursuitImpairment(gazeStability);
    const fixationImpairment = this.calculateFixationImpairment(fixationDuration);
    
    const overallScore = 100 - (saccadeImpairment + pursuitImpairment + fixationImpairment) / 3;
    
    return {
      saccadeImpairment,
      pursuitImpairment, 
      fixationImpairment,
      overallScore,
      riskLevel: this.calculateRiskLevel(overallScore),
      confidence: this.calculateConfidence(eyeData)
    };
  }

  private async enhanceWithAI(algorithmicResult: any, eyeData: any, saccadicData: any) {
    try {
      // Prepare the data for your existing API route
      const rawMetrics = {
        // Extract key metrics from eye tracking data
        saccadicLatency: saccadicData?.saccadicLatency || saccadicData?.latency || 200,
        gazeStability: eyeData?.gazeStability || 0.7,
        fixationDuration: eyeData?.fixationDuration || 250,
        saccadeVelocity: eyeData?.saccadeVelocity || 45,
        asymmetry: eyeData?.asymmetry || 0.05,
        averageEAR: eyeData?.averageEAR || 0.3,
        blinkRate: this.calculateBlinkRate(eyeData),
        historyLength: eyeData?.history?.length || 0,
        faceDetected: eyeData?.faceDetected || false,
        confidence: eyeData?.confidence || 0.5
      };

      // Create dynamic prompt with actual values
      const dynamicPrompt = this.analysisPrompt
        .replace('[LATENCY]', rawMetrics.saccadicLatency.toFixed(0))
        .replace('[STABILITY]', (rawMetrics.gazeStability * 100).toFixed(0))
        .replace('[FIXATION]', rawMetrics.fixationDuration.toFixed(0))
        .replace('[VELOCITY]', rawMetrics.saccadeVelocity.toFixed(1))
        .replace('[ASYMMETRY]', rawMetrics.asymmetry.toFixed(3))
        .replace('[BLINK_RATE]', rawMetrics.blinkRate.toFixed(0));

      // Use your existing API route - this will work perfectly!
      const response = await fetch('/api/analyze-cognitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithmicResult,
          rawMetrics,
          prompt: dynamicPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const aiAnalysis = await response.json();
      
      // Merge algorithmic results with AI enhancements
      return this.mergeAnalyses(algorithmicResult, aiAnalysis);
      
    } catch (error) {
      console.warn('AI analysis failed, using algorithmic fallback:', error);
      // Fallback to algorithmic result if AI fails
      return this.getFallbackAnalysis(algorithmicResult);
    }
  }

  private mergeAnalyses(algorithmicResult: any, aiAnalysis: any): CognitiveAnalysisResult {
    const riskLevel = aiAnalysis.riskLevel || algorithmicResult.riskLevel;
    
    return {
      riskLevel: riskLevel as 'low' | 'medium' | 'high',
      confidence: aiAnalysis.confidence || algorithmicResult.confidence,
      biomarkers: {
        saccadeImpairment: algorithmicResult.saccadeImpairment,
        pursuitImpairment: algorithmicResult.pursuitImpairment,
        fixationImpairment: algorithmicResult.fixationImpairment,
        velocityImpairment: algorithmicResult.velocityImpairment,
        overallScore: algorithmicResult.overallScore
      },
      patterns: aiAnalysis.patterns || this.generatePatterns(algorithmicResult),
      recommendations: aiAnalysis.recommendations || this.generateRecommendations(riskLevel),
      professionalGuidance: aiAnalysis.professionalGuidance || this.getProfessionalGuidance(riskLevel)
    };
  }

  private calculateBlinkRate(eyeData: any): number {
    if (!eyeData.history || !Array.isArray(eyeData.history)) return 15;
    
    const blinkCount = eyeData.history.filter((data: any) => data.isBlink).length;
    const durationMinutes = eyeData.history.length / 60; // Assuming 60fps for 1 second per 60 data points
    return durationMinutes > 0 ? blinkCount / durationMinutes : 15;
  }

  private calculateSaccadeImpairment(latency: number): number {
    if (latency < 200) return 0;
    if (latency < 300) return 25;
    if (latency < 400) return 50;
    return 75;
  }

  private calculatePursuitImpairment(stability: number): number {
    return Math.max(0, 100 - (stability * 100));
  }

  private calculateFixationImpairment(duration: number): number {
    if (duration > 300) return 0;
    if (duration > 200) return 20;
    if (duration > 100) return 40;
    return 60;
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  private calculateConfidence(eyeData: any): number {
    const dataPoints = eyeData.history?.length || 0;
    const quality = eyeData.confidence || 0.5;
    return Math.min(0.95, 0.7 + (dataPoints / 100) * 0.2 + quality * 0.1);
  }

  private getFallbackAnalysis(algorithmicResult: any): CognitiveAnalysisResult {
    const riskLevel = algorithmicResult.riskLevel as 'low' | 'medium' | 'high';
    
    return {
      riskLevel,
      confidence: algorithmicResult.confidence,
      biomarkers: {
        saccadeImpairment: algorithmicResult.saccadeImpairment,
        pursuitImpairment: algorithmicResult.pursuitImpairment,
        fixationImpairment: algorithmicResult.fixationImpairment,
        velocityImpairment: algorithmicResult.velocityImpairment,
        overallScore: algorithmicResult.overallScore
      },
      patterns: this.generatePatterns(algorithmicResult),
      recommendations: this.generateRecommendations(riskLevel),
      professionalGuidance: this.getProfessionalGuidance(riskLevel)
    };
  }

  private generatePatterns(result: any): string[] {
    const patterns: string[] = [];
    
    if (result.saccadeImpairment > 40) {
      patterns.push("Delayed saccadic eye movements observed");
    }
    
    if (result.pursuitImpairment > 50) {
      patterns.push("Reduced smooth pursuit tracking capability");
    }
    
    if (result.fixationImpairment > 30) {
      patterns.push("Decreased fixation stability during visual tasks");
    }
    
    return patterns;
  }

  private generateRecommendations(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const baseRecommendations = [
      "Consult with a neurologist for comprehensive evaluation",
      "Consider annual cognitive screening assessments",
      "Maintain regular physical and mental activity"
    ];

    const riskSpecific: Record<'low' | 'medium' | 'high', string[]> = {
      low: [
        "Continue with healthy lifestyle habits",
        "Regular eye movement exercises may maintain cognitive function"
      ],
      medium: [
        "Schedule appointment with healthcare provider within 3 months",
        "Cognitive training exercises recommended",
        "Monitor for changes in memory or concentration"
      ],
      high: [
        "Urgent consultation with neurologist recommended",
        "Comprehensive neuropsychological assessment advised",
        "Regular monitoring of daily functioning changes"
      ]
    };

    return [...baseRecommendations, ...riskSpecific[riskLevel]];
  }

  private getProfessionalGuidance(riskLevel: 'low' | 'medium' | 'high'): string {
    const guidance: Record<'low' | 'medium' | 'high', string> = {
      low: "These results appear within normal ranges for cognitive screening. Continue regular health check-ups and maintain cognitive activities.",
      medium: "Some patterns suggest further evaluation may be beneficial. Please share these results with your healthcare provider for personalized assessment.",
      high: "These patterns indicate that professional neurological evaluation is recommended. Please consult with a specialist for comprehensive assessment."
    };

    return guidance[riskLevel];
  }
}