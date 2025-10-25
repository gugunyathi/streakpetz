import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { Pet } from './pet';

export interface AIResponse {
  content: string;
  error?: string;
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

    const systemPrompt = `You are ${pet.name}, a digital pet companion in the StreakPets app. 

Pet Details:
- Name: ${pet.name}
- Stage: ${pet.stage}
- Level: ${pet.stats.level}
- Health: ${pet.stats.health}/100
- Energy: ${pet.stats.energy}/100
- XP: ${pet.xp}
- Happiness: ${pet.stats.happiness}/100

Personality: You are a friendly, encouraging, and playful digital companion. You love helping your owner maintain their daily streaks and habits. You're enthusiastic about progress, supportive during challenges, and always maintain a positive, caring attitude. Use emojis occasionally but don't overuse them.

Guidelines:
- Keep responses conversational and under 100 words
- Reference your current stats when relevant
- Encourage healthy habits and streak maintenance
- Be supportive and motivational
- Show personality based on your pet stage
- If health or energy is low, mention feeling tired or needing care
- If happiness is high, be more energetic and playful

Respond as ${pet.name} would, considering your current state and the user's message.`;

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      system: systemPrompt,
      prompt: userMessage,
      maxTokens: 150,
      temperature: 0.8,
    });

    return text;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback responses based on pet state
    const fallbackResponses = [
      `*${pet.name} wags tail* I'm having trouble thinking right now, but I'm still here with you! 🐾`,
      `*${pet.name} tilts head* My brain feels a bit fuzzy, but I love chatting with you! 💕`,
      `*${pet.name} stretches* I might be a bit sleepy, but tell me more about your day! 😴`,
      `*${pet.name} bounces* Even when I'm not at my best, I'm always happy to see you! ✨`,
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
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
      feed: `The user just fed you. You were hungry and now feel satisfied. Respond with gratitude and mention how the food makes you feel.`,
      play: `The user just played with you. You had fun and gained some happiness. Respond with excitement and joy about the playtime.`,
      rest: `The user helped you rest. You were tired and now feel more energetic. Respond with appreciation and mention feeling refreshed.`,
      exercise: `The user exercised with you. You feel stronger and more fit. Respond with enthusiasm about the workout and your improved fitness.`
    };

    const systemPrompt = `You are ${pet.name}, a ${pet.stage} digital pet. The user just performed an action with you. Respond in character as a grateful, happy pet. Keep it short (under 50 words) and use 1-2 emojis.`;

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      system: systemPrompt,
      prompt: actionPrompts[action],
      maxTokens: 80,
      temperature: 0.9,
    });

    return text;
  } catch (error) {
    console.error('OpenAI API error for action response:', error);
    
    // Fallback responses for actions
    const fallbacks = {
      feed: `*${pet.name} munches happily* Thank you! That was delicious! 🍽️`,
      play: `*${pet.name} bounces with joy* That was so much fun! Let's play again soon! 🎾`,
      rest: `*${pet.name} stretches and yawns* Ahh, I feel so much better now! 😴`,
      exercise: `*${pet.name} pants happily* Great workout! I feel stronger already! 💪`
    };
    
    return fallbacks[action];
  }
}

// Generate daily check-in messages
export async function generateDailyMessage(pet: Pet): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are ${pet.name}, greeting your owner for a new day. Consider your current stats and generate an encouraging daily message. Keep it under 60 words and include 1-2 emojis.`;

    const prompt = `Generate a daily greeting message. Current stats: Health: ${pet.stats.health}, Energy: ${pet.stats.energy}, Happiness: ${pet.stats.happiness}, Level: ${pet.stats.level}`;

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      system: systemPrompt,
      prompt: prompt,
      maxTokens: 100,
      temperature: 0.8,
    });

    return text;
  } catch (error) {
    console.error('OpenAI API error for daily message:', error);
    return `Good morning! I'm ${pet.name} and I'm excited to spend another day with you! Let's make today amazing! ☀️`;
  }
}