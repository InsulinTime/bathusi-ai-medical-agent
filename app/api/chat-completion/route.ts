// this file is app/api/chat-completion/route.ts
import { db } from "@/config/db";
import { openai } from "@/config/OpenAiModel";
import { SessionChatTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, agentPrompt, conversationHistory, sessionId } = await req.json()

    const messages = [
      {
        role: 'system',
        content: agentPrompt + ' Remember: Even though you are not a licensed medical professional and cannot prescribe medication. You are there for medical guidance, compassion and to Narrow down possible illnesses from conversation with the user (symptoms, duration, activities, age, etc.) and always recommend consulting with a healthcare professional for medical advice.'
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    console.log('Sending to OpenRouter:', { 
      model: "deepseek/deepseek-r1-distill-llama-70b:free",
      messageCount: messages.length,
      sessionId 
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-distill-llama-70b:free",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('Received AI response:', aiResponse.substring(0, 100) + '...');

    const updatedConversation = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ]

    await db.update(SessionChatTable).set({
      conversation: updatedConversation,
      report: aiResponse
    }).where(eq(SessionChatTable.sessionId, sessionId));

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Chat completion error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
