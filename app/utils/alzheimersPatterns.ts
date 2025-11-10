// app/utils/alzheimersPatterns.ts
export interface AlzheimerPatterns {
  saccadeLatency: number;
  smoothPursuitGain: number;
  fixationStability: number;
  antisaccadeErrors: number;
  blinkRate: number;
  saccadeVelocity: number;
  fixationDuration: number;
  gazeStability: number;
  pupilMovementVariance: number;
}

export interface CognitiveAssessment {
  alzheimersRisk: 'low' | 'medium' | 'high';
  confidence: number;
  biomarkers: {
    saccadeImpairment: number;
    pursuitImpairment: number;
    fixationImpairment: number;
    velocityImpairment: number;
    overallCognitiveScore: number;
  };
  recommendations: string[];
  detailedMetrics: {
    saccadeLatency: number;
    pursuitGain: number;
    fixationStability: number;
    gazeConsistency: number;
  };
}

// Enhanced Alzheimer's pattern database with more metrics
const ALZHEIMERS_PATTERNS = {
  normal: {
    saccadeLatency: 160,
    smoothPursuitGain: 0.92,
    fixationStability: 0.88,
    antisaccadeErrors: 0.12,
    blinkRate: 0.25,
    saccadeVelocity: 45,
    fixationDuration: 320,
    gazeStability: 0.85,
    pupilMovementVariance: 0.08
  },
  earlyAlzheimers: {
    saccadeLatency: 280,
    smoothPursuitGain: 0.58,
    fixationStability: 0.38,
    antisaccadeErrors: 0.68,
    blinkRate: 0.18,
    saccadeVelocity: 28,
    fixationDuration: 180,
    gazeStability: 0.45,
    pupilMovementVariance: 0.25
  },
  advancedAlzheimers: {
    saccadeLatency: 380,
    smoothPursuitGain: 0.32,
    fixationStability: 0.18,
    antisaccadeErrors: 0.82,
    blinkRate: 0.12,
    saccadeVelocity: 18,
    fixationDuration: 90,
    gazeStability: 0.22,
    pupilMovementVariance: 0.42
  }
};

export function analyzeAlzheimersPatterns(eyeData: any[], saccadicData?: any): CognitiveAssessment {
  if (eyeData.length < 20) {
    return getDefaultAssessment('Insufficient data for analysis');
  }

  try {
    const metrics = calculateEnhancedEyeMetrics(eyeData);
    const similarityToAlzheimers = calculateEnhancedPatternSimilarity(metrics, ALZHEIMERS_PATTERNS.earlyAlzheimers);
    const similarityToNormal = calculateEnhancedPatternSimilarity(metrics, ALZHEIMERS_PATTERNS.normal);
    
    // Enhanced risk assessment with more factors
    let alzheimersRisk: 'low' | 'medium' | 'high';
    let confidence = 0.7;
    
    const riskScore = calculateRiskScore(metrics, similarityToAlzheimers, similarityToNormal);
    
    if (riskScore >= 0.7) {
      alzheimersRisk = 'high';
      confidence = Math.min(0.95, 0.8 + (riskScore - 0.7) * 0.5);
    } else if (riskScore >= 0.4) {
      alzheimersRisk = 'medium';
      confidence = 0.75 + (riskScore - 0.4) * 0.3;
    } else {
      alzheimersRisk = 'low';
      confidence = 0.8 - (riskScore * 0.2);
    }

    // Incorporate saccadic test data if available
    if (saccadicData) {
      const enhancedRisk = incorporateSaccadicData(alzheimersRisk, confidence, saccadicData);
      alzheimersRisk = enhancedRisk.risk;
      confidence = enhancedRisk.confidence;
    }

    const biomarkers = calculateBiomarkers(metrics);
    const recommendations = generateEnhancedRecommendations(alzheimersRisk, metrics, biomarkers);

    return {
      alzheimersRisk,
      confidence,
      biomarkers,
      recommendations,
      detailedMetrics: {
        saccadeLatency: metrics.saccadeLatency,
        pursuitGain: metrics.smoothPursuitGain,
        fixationStability: metrics.fixationStability,
        gazeConsistency: metrics.gazeStability
      }
    };
  } catch (error) {
    console.error('Error in Alzheimer analysis:', error);
    return getDefaultAssessment('Analysis error');
  }
}

function calculateEnhancedEyeMetrics(eyeData: any[]) {
  // Calculate comprehensive metrics from enhanced eye tracking data
  const saccadeLatency = calculateEnhancedSaccadeLatency(eyeData);
  const smoothPursuitGain = calculateEnhancedSmoothPursuitGain(eyeData);
  const fixationStability = calculateEnhancedFixationStability(eyeData);
  const antisaccadeErrors = calculateEnhancedAntisaccadeErrors(eyeData);
  const blinkRate = calculateEnhancedBlinkRate(eyeData);
  const saccadeVelocity = calculateAverageSaccadeVelocity(eyeData);
  const fixationDuration = calculateAverageFixationDuration(eyeData);
  const gazeStability = calculateOverallGazeStability(eyeData);
  const pupilMovementVariance = calculatePupilMovementVariance(eyeData);

  return {
    saccadeLatency,
    smoothPursuitGain,
    fixationStability,
    antisaccadeErrors,
    blinkRate,
    saccadeVelocity,
    fixationDuration,
    gazeStability,
    pupilMovementVariance
  };
}

function calculateEnhancedSaccadeLatency(eyeData: any[]): number {
  if (eyeData.length < 3) return 200;
  
  let totalLatency = 0;
  let count = 0;
  
  for (let i = 2; i < eyeData.length; i++) {
    const currentMovement = eyeData[i].movement;
    const prevMovement = eyeData[i-1].movement;
    
    // Detect saccade onset (sudden movement increase)
    if (currentMovement > 0.02 && prevMovement < 0.01) {
      const latency = 100; // Simplified - would use precise timestamps
      totalLatency += latency;
      count++;
    }
  }
  
  return count > 0 ? totalLatency / count : 200;
}

function calculateEnhancedSmoothPursuitGain(eyeData: any[]): number {
  const stability = eyeData.reduce((acc, curr) => acc + curr.gazeStability, 0) / eyeData.length;
  const movement = eyeData.reduce((acc, curr) => acc + curr.movement, 0) / eyeData.length;
  
  // Combined metric for pursuit gain
  return Math.max(0.2, Math.min(1, stability * (1 - movement * 5)));
}

function calculateEnhancedFixationStability(eyeData: any[]): number {
  const fixationData = eyeData.filter(data => data.movement < 0.005);
  const fixationRatio = fixationData.length / eyeData.length;
  const avgFixationDuration = fixationData.length > 0 
    ? fixationData.reduce((acc, curr) => acc + curr.fixationDuration, 0) / fixationData.length 
    : 0;
  
  return Math.max(0.1, Math.min(1, fixationRatio * (avgFixationDuration / 300)));
}

// ... Add other enhanced calculation functions

function calculateRiskScore(metrics: any, similarityToAlzheimers: number, similarityToNormal: number): number {
  const weights = {
    saccadeLatency: 0.20,
    smoothPursuitGain: 0.18,
    fixationStability: 0.16,
    antisaccadeErrors: 0.14,
    saccadeVelocity: 0.12,
    gazeStability: 0.10,
    pupilMovementVariance: 0.10
  };

  let riskScore = 0;
  
  // High latency = higher risk
  if (metrics.saccadeLatency > 250) {
    riskScore += ((metrics.saccadeLatency - 250) / 200) * weights.saccadeLatency;
  }
  
  // Low pursuit gain = higher risk
  if (metrics.smoothPursuitGain < 0.7) {
    riskScore += ((0.7 - metrics.smoothPursuitGain) / 0.7) * weights.smoothPursuitGain;
  }
  
  // Poor fixation = higher risk
  if (metrics.fixationStability < 0.6) {
    riskScore += ((0.6 - metrics.fixationStability) / 0.6) * weights.fixationStability;
  }
  
  // High error rate = higher risk
  riskScore += metrics.antisaccadeErrors * weights.antisaccadeErrors;
  
  // Low velocity = higher risk
  if (metrics.saccadeVelocity < 35) {
    riskScore += ((35 - metrics.saccadeVelocity) / 35) * weights.saccadeVelocity;
  }
  
  // Poor gaze stability = higher risk
  if (metrics.gazeStability < 0.6) {
    riskScore += ((0.6 - metrics.gazeStability) / 0.6) * weights.gazeStability;
  }
  
  // High variance = higher risk
  riskScore += metrics.pupilMovementVariance * weights.pupilMovementVariance;

  return Math.min(1, riskScore);
}

// Add the missing utility functions
function calculateEnhancedPatternSimilarity(metrics: any, pattern: any): number {
  const weights = {
    saccadeLatency: 0.18,
    smoothPursuitGain: 0.16,
    fixationStability: 0.15,
    antisaccadeErrors: 0.14,
    blinkRate: 0.08,
    saccadeVelocity: 0.12,
    fixationDuration: 0.09,
    gazeStability: 0.08
  };

  let similarity = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const measured = metrics[key];
    const expected = pattern[key];
    
    if (measured !== undefined && expected !== undefined) {
      const normalizedDiff = Math.abs(measured - expected) / (Math.abs(expected) + 0.001);
      similarity += (1 - Math.min(normalizedDiff, 1)) * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? similarity / totalWeight : 0;
}

function incorporateSaccadicData(currentRisk: 'low' | 'medium' | 'high', currentConfidence: number, saccadicData: any) {
  let risk = currentRisk;
  let confidence = currentConfidence;

  if (saccadicData.saccadicLatency > 320) {
    if (risk === 'low') risk = 'medium';
    else if (risk === 'medium') risk = 'high';
    confidence = Math.min(0.95, confidence + 0.1);
  } else if (saccadicData.accuracy < 70) {
    if (risk === 'low') risk = 'medium';
    confidence += 0.05;
  }

  return { risk, confidence };
}

function calculateBiomarkers(metrics: any) {
  const saccadeImpairment = Math.min(100, (metrics.saccadeLatency / 400) * 100);
  const pursuitImpairment = Math.min(100, ((1 - metrics.smoothPursuitGain) / 0.8) * 100);
  const fixationImpairment = Math.min(100, ((1 - metrics.fixationStability) / 0.9) * 100);
  const velocityImpairment = Math.min(100, ((40 - metrics.saccadeVelocity) / 40) * 100);
  
  const overallCognitiveScore = Math.max(0, 100 - (
    saccadeImpairment * 0.3 + 
    pursuitImpairment * 0.25 + 
    fixationImpairment * 0.25 + 
    velocityImpairment * 0.2
  ));

  return {
    saccadeImpairment,
    pursuitImpairment,
    fixationImpairment,
    velocityImpairment,
    overallCognitiveScore
  };
}

function generateEnhancedRecommendations(risk: string, metrics: any, biomarkers: any): string[] {
  const recommendations = [];
  
  if (risk === 'high') {
    recommendations.push(
      'Urgent consultation with neurologist recommended',
      'Comprehensive cognitive assessment advised',
      'Regular monitoring of daily functioning changes',
      'Consider brain imaging studies if not recently done'
    );
  } else if (risk === 'medium') {
    recommendations.push(
      'Schedule appointment with healthcare provider',
      'Cognitive exercises and brain training recommended',
      'Monitor for memory and concentration changes',
      'Maintain healthy lifestyle with regular exercise'
    );
  } else {
    recommendations.push(
      'Continue regular health check-ups',
      'Maintain cognitive activities and social engagement',
      'Healthy Mediterranean diet may support brain health',
      'Regular physical activity supports cognitive function'
    );
  }

  // Specific recommendations based on biomarkers
  if (biomarkers.saccadeImpairment > 40) {
    recommendations.push('Eye movement exercises may improve coordination');
  }
  
  if (biomarkers.fixationImpairment > 50) {
    recommendations.push('Focus and attention training could be beneficial');
  }
  
  if (biomarkers.velocityImpairment > 30) {
    recommendations.push('Visual tracking exercises may help eye movement speed');
  }

  return recommendations.slice(0, 6); // Limit to 6 recommendations
}

function getDefaultAssessment(message: string): CognitiveAssessment {
  return {
    alzheimersRisk: 'low',
    confidence: 0.3,
    biomarkers: {
      saccadeImpairment: 0,
      pursuitImpairment: 0,
      fixationImpairment: 0,
      velocityImpairment: 0,
      overallCognitiveScore: 75
    },
    recommendations: [message],
    detailedMetrics: {
      saccadeLatency: 0,
      pursuitGain: 0,
      fixationStability: 0,
      gazeConsistency: 0
    }
  };
}

// Add missing calculation functions
function calculateEnhancedAntisaccadeErrors(eyeData: any[]): number {
  const asymmetry = eyeData.reduce((acc, curr) => acc + curr.asymmetry, 0) / eyeData.length;
  return Math.min(1, asymmetry * 8);
}

function calculateEnhancedBlinkRate(eyeData: any[]): number {
  const blinkCount = eyeData.filter(data => data.isBlink).length;
  return Math.min(1, blinkCount / eyeData.length);
}

function calculateAverageSaccadeVelocity(eyeData: any[]): number {
  const velocities = eyeData.map(data => data.saccadeVelocity || 0).filter(v => v > 0);
  return velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 40;
}

function calculateAverageFixationDuration(eyeData: any[]): number {
  const durations = eyeData.map(data => data.fixationDuration || 0);
  return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 200;
}

function calculateOverallGazeStability(eyeData: any[]): number {
  const stabilities = eyeData.map(data => data.gazeStability || 0);
  return stabilities.length > 0 ? stabilities.reduce((a, b) => a + b, 0) / stabilities.length : 0.7;
}

function calculatePupilMovementVariance(eyeData: any[]): number {
  if (eyeData.length < 2) return 0.1;
  
  const movements = eyeData.map(data => data.movement || 0);
  const mean = movements.reduce((a, b) => a + b, 0) / movements.length;
  const variance = movements.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / movements.length;
  
  return Math.min(1, variance * 100);
}