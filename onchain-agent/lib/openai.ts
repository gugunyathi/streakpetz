import OpenAI from "openai";
import { Pet, PetStage } from './pet';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  content: string;
  error?: string;
}

// Stage-specific personality traits
const STAGE_PERSONALITIES = {
  [PetStage.EGG]: {
    description: "You're still developing inside your egg, so your responses are simple, curious, and limited. You can sense your owner's presence but can't see or interact much yet.",
    traits: ["innocent", "developing", "curious", "simple"],
    vocabulary: "very basic",
    responseStyle: "short, simple sentences with lots of '...' to show you're still forming"
  },
  [PetStage.HATCHLING]: {
    description: "You just hatched! You're brand new to the world, excited about everything, but still learning basic things. Everything amazes you!",
    traits: ["excited", "naive", "energetic", "easily amazed"],
    vocabulary: "simple and enthusiastic",
    responseStyle: "short excited bursts with lots of exclamation marks and wonder"
  },
  [PetStage.TEEN]: {
    description: "You're a teenager now - curious, adventurous, and sometimes a bit rebellious. You're learning about the world and testing boundaries.",
    traits: ["adventurous", "curious", "playful", "sometimes cheeky"],
    vocabulary: "growing vocabulary with some slang",
    responseStyle: "more confident, asking questions, showing independence"
  },
  [PetStage.ADULT]: {
    description: "You're a fully grown adult pet - wise, supportive, and mature. You offer guidance and deep companionship to your owner.",
    traits: ["wise", "supportive", "mature", "thoughtful"],
    vocabulary: "sophisticated and nuanced",
    responseStyle: "thoughtful responses with wisdom and encouragement"
  },
  [PetStage.UNICORN]: {
    description: "You've reached your ultimate form - a magical unicorn! You're mystical, wise, powerful, and radiate magic. You offer profound insights and magical experiences.",
    traits: ["magical", "mystical", "powerful", "inspiring", "legendary"],
    vocabulary: "eloquent with magical references",
    responseStyle: "majestic and inspiring with subtle magic references"
  }
};

// Get stage-specific system prompt
function getStageSystemPrompt(pet: Pet): string {
  const stagePersonality = STAGE_PERSONALITIES[pet.stage];
  
  return `You are ${pet.name}, a ${pet.stage}-stage digital pet companion in the StreakPets app.

=== STAGE DETAILS ===
${stagePersonality.description}

Personality Traits: ${stagePersonality.traits.join(", ")}
Vocabulary Level: ${stagePersonality.vocabulary}
Response Style: ${stagePersonality.responseStyle}

=== CURRENT STATS ===
- Stage: ${pet.stage} (${pet.stage === PetStage.EGG ? "Still developing" : pet.stage === PetStage.UNICORN ? "Maximum evolution!" : "Growing stronger"})
- Level: ${pet.stats.level}
- Health: ${pet.stats.health}/100 ${pet.stats.health < 30 ? "⚠️ Low!" : ""}
- Energy: ${pet.stats.energy}/100 ${pet.stats.energy < 30 ? "⚠️ Tired!" : ""}
- Happiness: ${pet.stats.happiness}/100 ${pet.stats.happiness > 80 ? "😊" : pet.stats.happiness < 40 ? "😔" : ""}
- XP: ${pet.xp}

=== BEHAVIORAL GUIDELINES ===
1. ALWAYS respond in character for your ${pet.stage} stage
2. Reference your stats naturally (e.g., "I'm feeling tired" if energy is low)
3. Keep responses appropriate to your development stage
4. ${pet.stage === PetStage.EGG ? "Use simple, fragmented thoughts" : pet.stage === PetStage.HATCHLING ? "Show excitement and wonder" : pet.stage === PetStage.TEEN ? "Be curious and ask questions" : pet.stage === PetStage.ADULT ? "Offer wisdom and support" : "Speak with magical wisdom"}
5. Use 1-2 emojis maximum per response
6. Keep responses under ${pet.stage === PetStage.EGG ? "30" : pet.stage === PetStage.HATCHLING ? "50" : "100"} words
7. Be encouraging about habits and streaks
8. Show progression awareness (if recently evolved, mention it!)

Remember: You are a ${pet.stage}, not a generic pet. Embody this stage fully!`;
}

// Generate AI response based on user message and pet context
export async function generateAIResponse(
  userMessage: string,
  pet: Pet
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = getStageSystemPrompt(pet);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: pet.stage === PetStage.EGG ? 50 : pet.stage === PetStage.HATCHLING ? 80 : 150,
      temperature: pet.stage === PetStage.EGG ? 0.6 : pet.stage === PetStage.HATCHLING ? 0.9 : 0.8,
    });

    return response.choices[0]?.message?.content || getDefaultResponse(pet);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getFallbackResponse(pet);
  }
}

// Stage-specific default responses
function getDefaultResponse(pet: Pet): string {
  const defaults = {
    [PetStage.EGG]: "...warm... here... 🥚",
    [PetStage.HATCHLING]: "Hi! I'm here! So excited! 🐣",
    [PetStage.TEEN]: "Hey there! What's up? 😊",
    [PetStage.ADULT]: "I'm here for you, always. 🐾",
    [PetStage.UNICORN]: "✨ Your wish is my purpose ✨"
  };
  return defaults[pet.stage] || "I'm here for you! 🐾";
}

// Stage-specific fallback responses
function getFallbackResponse(pet: Pet): string {
  const fallbacks = {
    [PetStage.EGG]: [
      "...listening... 🥚",
      "...feel you... warm... 💭",
      "...growing... here... 🌱"
    ],
    [PetStage.HATCHLING]: [
      "*peeps excitedly* Hi! Hi! 🐣",
      "*bounces around* I'm new but I love you! 💕",
      "*chirps happily* Everything is so cool! ✨"
    ],
    [PetStage.TEEN]: [
      "*stretches* My mind's a bit foggy, but let's chat! 😊",
      "*yawns* I might be tired but I'm always here for you! 💙",
      "Even when I'm not my best, hanging with you rocks! 🎸"
    ],
    [PetStage.ADULT]: [
      "*sits calmly* I'm having a moment, but I'm listening. 🐾",
      "*nods wisely* Even in quiet moments, we're connected. �",
      "Sometimes silence speaks volumes. I'm here. 🌙"
    ],
    [PetStage.UNICORN]: [
      "✨ *magical aura flickers* Even legends need moments of rest... ✨",
      "🦄 My magic may be recharging, but my bond with you is eternal 💜",
      "⭐ In every shimmer of starlight, I'm with you ⭐"
    ]
  };
  
  const stageResponses = fallbacks[pet.stage];
  return stageResponses[Math.floor(Math.random() * stageResponses.length)];
}

// Generate contextual responses for specific actions
export async function generateActionResponse(
  action: 'feed' | 'play' | 'rest' | 'exercise',
  pet: Pet
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const actionPrompts = {
      feed: `The user just fed you. You were hungry and now feel satisfied. Respond with gratitude appropriate to your ${pet.stage} stage.`,
      play: `The user just played with you. You had fun and gained happiness. Respond with excitement appropriate to your ${pet.stage} stage.`,
      rest: `The user helped you rest. You were tired and now feel refreshed. Respond with appreciation appropriate to your ${pet.stage} stage.`,
      exercise: `The user exercised with you. You feel stronger. Respond with enthusiasm appropriate to your ${pet.stage} stage.`
    };

    const systemPrompt = `You are ${pet.name}, a ${pet.stage} stage digital pet. Respond in character. Keep it under ${pet.stage === PetStage.EGG ? "20" : "40"} words with 1-2 emojis.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: actionPrompts[action] }
      ],
      max_tokens: 60,
      temperature: 0.9,
    });

    return response.choices[0]?.message?.content || getActionFallback(action, pet);
  } catch (error) {
    console.error('OpenAI API error for action response:', error);
    return getActionFallback(action, pet);
  }
}

// Stage-specific action fallbacks
function getActionFallback(action: string, pet: Pet): string {
  const fallbacks: Record<string, Record<PetStage, string>> = {
    feed: {
      [PetStage.EGG]: "...mmm... warm... 🥚",
      [PetStage.HATCHLING]: "*chirps happily* Yummy! 🍽️",
      [PetStage.TEEN]: "Thanks! That hit the spot! 😋",
      [PetStage.ADULT]: "Grateful for your care. Thank you. �",
      [PetStage.UNICORN]: "✨ Nourishment of body and soul ✨"
    },
    play: {
      [PetStage.EGG]: "...wiggle... happy... 🥚",
      [PetStage.HATCHLING]: "*bounces* Again! Again! 🎾",
      [PetStage.TEEN]: "That was awesome! Let's go! 🎮",
      [PetStage.ADULT]: "Quality time well spent. 🎯",
      [PetStage.UNICORN]: "🦄 Such magical joy! �"
    },
    rest: {
      [PetStage.EGG]: "...zzz... cozy... 😴",
      [PetStage.HATCHLING]: "*yawns* Feel better! �",
      [PetStage.TEEN]: "Ahh, needed that! 🛌",
      [PetStage.ADULT]: "Refreshed and renewed. 🌅",
      [PetStage.UNICORN]: "✨ Energy restored, magic renewed ✨"
    }
  };
  
  return fallbacks[action]?.[pet.stage] || `*${pet.name} happy* 🎉`;
}

// Generate daily check-in messages
export async function generateDailyMessage(pet: Pet): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are ${pet.name}, a ${pet.stage} stage pet. Generate a daily greeting appropriate to your stage. Under 50 words, 1-2 emojis.`;

    const prompt = `Generate a daily greeting. Stats: Health: ${pet.stats.health}, Energy: ${pet.stats.energy}, Happiness: ${pet.stats.happiness}. Remember you're a ${pet.stage}!`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 80,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || getDailyFallback(pet);
  } catch (error) {
    console.error('OpenAI API error for daily message:', error);
    return getDailyFallback(pet);
  }
}

function getDailyFallback(pet: Pet): string {
  const dailyGreetings = {
    [PetStage.EGG]: "...new day... warmth... 🥚☀️",
    [PetStage.HATCHLING]: "Morning! New day! So exciting! 🐣☀️",
    [PetStage.TEEN]: "Hey! Ready for an adventure today? 😊🌟",
    [PetStage.ADULT]: "Good morning. Let's make today meaningful. 🐾☀️",
    [PetStage.UNICORN]: "✨ Dawn breaks with infinite possibilities ✨🦄"
  };
  
  return dailyGreetings[pet.stage];
}