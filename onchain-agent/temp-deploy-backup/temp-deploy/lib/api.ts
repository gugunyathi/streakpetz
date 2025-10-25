// API Service for managing friends and other API calls
export interface Friend {
  id: string;
  address: string;
  name?: string;
  xmtpAvailable: boolean;
  inviteSent: boolean;
  addedAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  friends = {
    getAll: async (): Promise<ApiResponse<Friend[]>> => {
      try {
        const response = await fetch(`${this.baseUrl}/friends`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching friends:', error);
        return { success: false, error: 'Failed to fetch friends' };
      }
    },

    add: async (friend: Omit<Friend, 'id' | 'addedAt'>): Promise<ApiResponse<Friend>> => {
      try {
        const response = await fetch(`${this.baseUrl}/friends`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(friend),
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error adding friend:', error);
        return { success: false, error: 'Failed to add friend' };
      }
    },

    update: async (id: string, friend: Friend): Promise<ApiResponse<Friend>> => {
      try {
        const response = await fetch(`${this.baseUrl}/friends/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(friend),
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error updating friend:', error);
        return { success: false, error: 'Failed to update friend' };
      }
    },

    remove: async (id: string): Promise<ApiResponse<void>> => {
      try {
        const response = await fetch(`${this.baseUrl}/friends/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error removing friend:', error);
        return { success: false, error: 'Failed to remove friend' };
      }
    },
  };
}