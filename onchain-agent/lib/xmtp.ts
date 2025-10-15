import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';

export interface XMTPMessage {
  id: string;
  content: string;
  senderAddress: string;
  recipientAddress?: string;
  timestamp: Date;
  conversationTopic?: string;
}

export interface XMTPConversation {
  topic: string;
  peerAddress: string;
  createdAt: Date;
  lastMessage?: XMTPMessage;
}

// Initialize XMTP client with wallet signer
export async function initializeXMTPClient(wallet: Wallet): Promise<Client> {
  try {
    const xmtp = await Client.create(wallet, {
      env: (process.env.NEXT_PUBLIC_XMTP_ENV as 'dev' | 'production') || 'dev',
    });
    return xmtp;
  } catch (error) {
    console.error('Failed to initialize XMTP client:', error);
    throw new Error('XMTP initialization failed');
  }
}

// Send message to pet's wallet address
export async function sendMessageToPet(
  client: Client,
  petWalletAddress: string,
  message: string
): Promise<void> {
  try {
    const conversation = await client.conversations.newConversation(petWalletAddress);
    await conversation.send(message);
  } catch (error) {
    console.error('Failed to send message to pet:', error);
    throw new Error('Failed to send message');
  }
}

// Listen for incoming messages
export async function listenForMessages(
  client: Client,
  onMessage: (message: XMTPMessage) => void
): Promise<void> {
  try {
    const conversations = await client.conversations.list();
    
    for (const conversation of conversations) {
      // Listen for new messages
      for await (const message of await conversation.streamMessages()) {
        const xmtpMessage: XMTPMessage = {
          id: message.id,
          content: message.content,
          senderAddress: message.senderAddress,
          timestamp: message.sent,
        };
        onMessage(xmtpMessage);
      }
    }
  } catch (error) {
    console.error('Failed to listen for messages:', error);
    throw new Error('Failed to listen for messages');
  }
}

// Get conversation history
export async function getConversationHistory(
  client: Client,
  peerAddress: string
): Promise<XMTPMessage[]> {
  try {
    const conversation = await client.conversations.newConversation(peerAddress);
    const messages = await conversation.messages();
    
    return messages.map(message => ({
      id: message.id,
      content: message.content,
      senderAddress: message.senderAddress,
      timestamp: message.sent,
    }));
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

// Listen for messages from pet wallet
export async function listenForPetMessages(
  client: Client,
  petWalletAddress: string,
  onMessage: (message: XMTPMessage) => void
): Promise<void> {
  try {
    const conversations = await client.conversations.list();
    const petConversation = conversations.find(
      conv => conv.peerAddress.toLowerCase() === petWalletAddress.toLowerCase()
    );

    if (petConversation) {
      // Listen for new messages in the conversation
      for await (const message of await petConversation.streamMessages()) {
        const xmtpMessage: XMTPMessage = {
          id: message.id,
          content: message.content,
          senderAddress: message.senderAddress,
          recipientAddress: client.address,
          timestamp: message.sent,
          conversationTopic: petConversation.topic,
        };
        onMessage(xmtpMessage);
      }
    }
  } catch (error) {
    console.error('Failed to listen for pet messages:', error);
    throw new Error('Message listening failed');
  }
}

// Get conversation history with pet
export async function getPetConversationHistory(
  client: Client,
  petWalletAddress: string,
  limit: number = 50
): Promise<XMTPMessage[]> {
  try {
    const conversations = await client.conversations.list();
    const petConversation = conversations.find(
      conv => conv.peerAddress.toLowerCase() === petWalletAddress.toLowerCase()
    );

    if (!petConversation) {
      return [];
    }

    const messages = await petConversation.messages({ limit });
    return messages.map(message => ({
      id: message.id,
      content: message.content,
      senderAddress: message.senderAddress,
      recipientAddress: message.senderAddress === client.address ? petWalletAddress : client.address,
      timestamp: message.sent,
      conversationTopic: petConversation.topic,
    }));
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

// Get all conversations for the user
export async function getUserConversations(client: Client): Promise<XMTPConversation[]> {
  try {
    const conversations = await client.conversations.list();
    
    const conversationList: XMTPConversation[] = [];
    
    for (const conversation of conversations) {
      const messages = await conversation.messages({ limit: 1 });
      const lastMessage = messages.length > 0 ? {
        id: messages[0].id,
        content: messages[0].content,
        senderAddress: messages[0].senderAddress,
        recipientAddress: conversation.peerAddress,
        timestamp: messages[0].sent,
        conversationTopic: conversation.topic,
      } : undefined;

      conversationList.push({
        topic: conversation.topic,
        peerAddress: conversation.peerAddress,
        createdAt: conversation.createdAt,
        lastMessage,
      });
    }

    return conversationList;
  } catch (error) {
    console.error('Failed to get user conversations:', error);
    return [];
  }
}

// Check if address can message (has XMTP identity)
export async function canMessage(client: Client, address: string): Promise<boolean> {
  try {
    return await client.canMessage(address);
  } catch (error) {
    console.error('Failed to check if address can message:', error);
    return false;
  }
}