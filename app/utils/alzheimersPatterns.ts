// this file is app/utils/alzheimersPatterns.ts

export interface AlzheimerPatterns {
  saccadeLatency: number;        // Increased latency in Alzheimer's
  smoothPursuitGain: number;     // Reduced smooth pursuit gain
  fixationStability: number;     // Poor fixation stability
  antisaccadeErrors: number;     // More errors in antisaccade tasks
  blinkRate: number;            // Altered blink patterns
}

export interface CognitiveAssessment {
  alzheimersRisk: 'low' | 'medium' | 'high';
  confidence: number;
  biomarkers: {
    saccadeImpairment: number;
    pursuitImpairment: number;
    fixationImpairment: number;
    overallCognitiveScore: number;
  };
  recommendations: string[];
}

// Alzheimer's pattern database (simplified - you'll expand this with real data)
const ALZHEIMERS_PATTERNS = {
  // Normal patterns (healthy individuals)
  normal: {
    saccadeLatency: 180, // ms
    smoothPursuitGain: 0.95,
    fixationStability: 0.92,
    antisaccadeErrors: 0.15,
    blinkRate: 0.3
  },
  // Early Alzheimer's patterns
  earlyAlzheimers: {
    saccadeLatency: 280, // ms (increased)
    smoothPursuitGain: 0.65, // reduced
    fixationStability: 0.45, // poor
    antisaccadeErrors: 0.65, // increased errors
    blinkRate: 0.15 // altered
  },
  // Advanced Alzheimer's patterns
  advancedAlzheimers: {
    saccadeLatency: 380, // ms
    smoothPursuitGain: 0.35,
    fixationStability: 0.25,
    antisaccadeErrors: 0.85,
    blinkRate: 0.08
  }
};

export function analyzeAlzheimersPatterns(eyeData: any[], saccadicData?: any): CognitiveAssessment {
  if (eyeData.length < 10) {
    return {
      alzheimersRisk: 'low',
      confidence: 0.3,
      biomarkers: {
        saccadeImpairment: 0,
        pursuitImpairment: 0,
        fixationImpairment: 0,
        overallCognitiveScore: 75
      },
      recommendations: ['Collect more data for accurate assessment']
    };
  }

  // Calculate metrics from eye tracking data
  const metrics: ReturnType<typeof calculateEyeMetrics> = calculateEyeMetrics(eyeData);
  
  // Compare with known Alzheimer's patterns
  const similarityToAlzheimers = calculatePatternSimilarity(metrics, ALZHEIMERS_PATTERNS.earlyAlzheimers);
  const similarityToNormal = calculatePatternSimilarity(metrics, ALZHEIMERS_PATTERNS.normal);
  
  // Determine risk level
  let alzheimersRisk: 'low' | 'medium' | 'high';
  let confidence = 0.7;
  
  if (similarityToAlzheimers > 0.7 && similarityToNormal < 0.3) {
    alzheimersRisk = 'high';
    confidence = 0.85;
  } else if (similarityToAlzheimers > 0.5 && similarityToNormal < 0.5) {
    alzheimersRisk = 'medium';
    confidence = 0.75;
  } else {
    alzheimersRisk = 'low';
    confidence = 0.8;
  }

  if (saccadicData) {
    // Use actual saccadic latency from the test
    metrics.saccadeLatency = saccadicData.saccadicLatency
    metrics.accuracy = saccadicData.accuracy
    
    // More accurate risk assessment with structured test data
    if (saccadicData.saccadicLatency > 300) { // High latency = higher risk
      alzheimersRisk = 'high'
      confidence = 0.9
    }
  }

  // Calculate biomarker scores
  const saccadeImpairment = Math.min(100, (metrics.saccadeLatency / 400) * 100);
  const pursuitImpairment = Math.min(100, ((1 - metrics.smoothPursuitGain) / 0.7) * 100);
  const fixationImpairment = Math.min(100, ((1 - metrics.fixationStability) / 0.75) * 100);
  
  const overallCognitiveScore = Math.max(0, 100 - (saccadeImpairment + pursuitImpairment + fixationImpairment) / 3);

  // Generate recommendations
  const recommendations = generateRecommendations(alzheimersRisk, metrics);

  return {
    alzheimersRisk,
    confidence,
    biomarkers: {
      saccadeImpairment,
      pursuitImpairment,
      fixationImpairment,
      overallCognitiveScore
    },
    recommendations
  };
}

function calculateEyeMetrics(eyeData: any[]) {
  // Calculate actual eye movement metrics from raw data
  const saccadeLatency = calculateSaccadeLatency(eyeData);
  const smoothPursuitGain = calculateSmoothPursuitGain(eyeData);
  const fixationStability = calculateFixationStability(eyeData);
  const antisaccadeErrors = calculateAntisaccadeErrors(eyeData);
  const blinkRate = calculateBlinkRate(eyeData);

  return {
    saccadeLatency,
    smoothPursuitGain,
    fixationStability,
    antisaccadeErrors,
    blinkRate,
    accuracy: 0 // Default value, can be updated later
  };
}

function calculateSaccadeLatency(eyeData: any[]): number {
  // Calculate average time between eye movements
  if (eyeData.length < 2) return 200;
  
  let totalLatency = 0;
  let count = 0;
  
  for (let i = 1; i < eyeData.length; i++) {
    const movement = Math.abs(eyeData[i].movement - eyeData[i-1].movement);
    if (movement > 0.01) { // Significant movement
      totalLatency += 100; // Simplified - real calculation would use timestamps
      count++;
    }
  }
  
  return count > 0 ? totalLatency / count : 200;
}

function calculateSmoothPursuitGain(eyeData: any[]): number {
  // Calculate how well eyes track moving objects
  const stability = eyeData.reduce((acc, curr) => acc + curr.gazeStability, 0) / eyeData.length;
  return Math.max(0.3, Math.min(1, stability));
}

function calculateFixationStability(eyeData: any[]): number {
  // Calculate how stable the gaze is during fixation
  const avgMovement = eyeData.reduce((acc, curr) => acc + curr.movement, 0) / eyeData.length;
  return Math.max(0.2, Math.min(1, 1 - (avgMovement * 10)));
}

function calculateAntisaccadeErrors(eyeData: any[]): number {
  // Simplified antisaccade error calculation
  const asymmetry = eyeData.reduce((acc, curr) => acc + curr.asymmetry, 0) / eyeData.length;
  return Math.min(1, asymmetry * 5);
}

function calculateBlinkRate(eyeData: any[]): number {
  const blinkCount = eyeData.filter(data => data.isBlink).length;
  return blinkCount / eyeData.length;
}

function calculatePatternSimilarity(metrics: any, pattern: any): number {
  // Calculate similarity between measured metrics and known patterns
  const weights = {
    saccadeLatency: 0.25,
    smoothPursuitGain: 0.25,
    fixationStability: 0.20,
    antisaccadeErrors: 0.20,
    blinkRate: 0.10
  };

  let similarity = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const measured = metrics[key];
    const expected = pattern[key];
    
    if (measured !== undefined && expected !== undefined) {
      const difference = Math.abs(measured - expected) / expected;
      similarity += (1 - Math.min(difference, 1)) * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? similarity / totalWeight : 0;
}

function generateRecommendations(risk: string, metrics: any): string[] {
  const recommendations = [];
  
  if (risk === 'high') {
    recommendations.push(
      'Consider consulting a neurologist for comprehensive cognitive assessment',
      'Regular cognitive exercises may help maintain brain health',
      'Monitor for changes in memory and daily functioning'
    );
  } else if (risk === 'medium') {
    recommendations.push(
      'Maintain regular physical and mental activity',
      'Consider annual cognitive screening',
      'Healthy diet and good sleep hygiene support brain health'
    );
  } else {
    recommendations.push(
      'Continue with healthy lifestyle habits',
      'Regular exercise supports cognitive health',
      'Annual check-ups are recommended for overall health maintenance'
    );
  }

  if (metrics.saccadeLatency > 250) {
    recommendations.push('Eye movement exercises may help improve coordination');
  }
  
  if (metrics.fixationStability < 0.6) {
    recommendations.push('Focus and attention exercises could be beneficial');
  }

  return recommendations;
}