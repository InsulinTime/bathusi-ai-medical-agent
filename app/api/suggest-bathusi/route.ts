// this file is app/api/suggest-bathusi/route.ts
import { openai } from '@/config/OpenAiModel';
import { AIBathusiAgents } from '@/shared/list';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { notes } = await req.json();
        
        if (!notes) {
            return NextResponse.json({ error: "Notes are required" }, { status: 400 });
        }

        console.log("Analyzing notes for specialist suggestion:", notes);

        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-4-maverick:free",
            messages: [
                {
                    role: 'system', 
                    content: `You are a medical assistant. Based on user symptoms, suggest the most relevant Bathusi-AI specialists from this list: ${JSON.stringify(AIBathusiAgents)}. 
                    
                    ALWAYS return a valid JSON array of specialist objects. Do not include any other text or explanations.
                    
                    Example response format:
                    [
                      {
                        "id": 1,
                        "specialist": "Bathusi-AI GP (General Health Assistant)",
                        "description": "Helps with everyday general health inquiries and advice.",
                        "image": "bathusi1.png",
                        "agentPrompt": "...",
                        "voiceId": "elliot",
                        "subscriptionRequired": false
                      }
                    ]`
                },
                { 
                    role: "user", 
                    content: `User symptoms: "${notes}". Please return ONLY a JSON array of the most relevant Bathusi-AI specialists based on these symptoms.` 
                }
            ],
        });

        const rawResp = completion.choices[0].message.content;
        
        if (!rawResp) {
            throw new Error('No response from AI');
        }

        console.log("Raw AI response:", rawResp);

        // Clean the response
        const cleanedResp = rawResp.trim()
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let JSONResp;
        try {
            JSONResp = JSON.parse(cleanedResp);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Cleaned response that failed to parse:", cleanedResp);
            
            // Fallback: Return all specialists if parsing fails
            return NextResponse.json(AIBathusiAgents);
        }

        // Ensure it's an array
        if (!Array.isArray(JSONResp)) {
            console.error("Response is not an array:", JSONResp);
            return NextResponse.json(AIBathusiAgents); // Fallback to all specialists
        }

        console.log("Successfully parsed response:", JSONResp.length, "specialists");
        return NextResponse.json(JSONResp);

    } catch (error: any) {
        console.error('Error in suggest-bathusi:', error);
        
        // Fallback: Return all specialists on error
        return NextResponse.json(AIBathusiAgents);
    }
}