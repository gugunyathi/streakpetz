import { AgentRequest, AgentResponse } from "@/app/types/api";
import { NextResponse } from "next/server";
import { createAgent } from "./create-agent";
import { generateAIResponse } from "@/lib/openai";
import { PetMood } from "@/lib/pet";

/**
 * Handles incoming POST requests to interact with the AI agent.
 * Can use either AgentKit or direct OpenAI based on the request.
 *
 * @function POST
 * @param {Request & { json: () => Promise<AgentRequest> }} req - The incoming request object containing the user message and pet context.
 * @returns {Promise<NextResponse<AgentResponse>>} JSON response containing the AI-generated reply or an error message.
 */
export async function POST(
  req: Request & { json: () => Promise<any> },
): Promise<NextResponse<AgentResponse>> {
  try {
    const body = await req.json();
    const { userMessage, petId, petStage, petStats } = body;

    // If pet context is provided, use our enhanced OpenAI with stage-specific behavior
    if (petId) {
      try {
        // Fetch full pet data from database
        const pet = await getPetById(petId);
        
        if (!pet) {
          // Use provided pet data as fallback
          const fallbackPet = {
            id: petId,
            name: 'Pet',
            stage: petStage || 'hatchling',
            stats: petStats || { health: 100, energy: 100, happiness: 80, level: 1 },
            xp: 0,
            mood: PetMood.HAPPY,
            userWalletAddress: '',
            streak: 0,
            lastInteraction: new Date(),
            createdAt: new Date(),
            personality: ['friendly', 'playful']
          };
          const response = await generateAIResponse(userMessage, fallbackPet as any);
          return NextResponse.json({ response });
        }

        // Use full pet data for context-aware response
        const response = await generateAIResponse(userMessage, pet);
        return NextResponse.json({ response });
      } catch (petError) {
        console.error('Error with pet-specific response:', petError);
        // Fall through to AgentKit if pet response fails
      }
    }

    // Fallback to AgentKit for non-pet conversations
    const agent = await createAgent();

    const stream = await agent.stream(
      { messages: [{ content: userMessage, role: "user" }] },
      { configurable: { thread_id: "AgentKit Discussion" } },
    );

    let agentResponse = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        agentResponse += chunk.agent.messages[0].content;
      }
    }

    return NextResponse.json({ response: agentResponse });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message
          : "I'm sorry, I encountered an issue processing your message. Please try again later.",
    });
  }
}

// Helper function to get pet by ID
async function getPetById(petId: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/pets?petId=${petId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.pet : null;
  } catch (error) {
    console.error('Error fetching pet:', error);
    return null;
  }
}
