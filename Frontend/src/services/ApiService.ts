import axios from 'axios';

const API_URL = 'http://localhost:3000';

export interface ChatResponse {
    text: string;
    facialExpression: string;
    animation: string;
    audio: string | null; // Base64 audio url
    voiceId?: string;
}

export const ApiService = {
    async sendChat(message: string, sessionId: string = 'default'): Promise<ChatResponse> {
        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message,
                sessionId,
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async sendVoice(audioBlob: Blob, sessionId: string = 'default'): Promise<ChatResponse> {
        const formData = new FormData();
        formData.append('file', audioBlob, 'input.wav');
        formData.append('sessionId', sessionId);

        try {
            const response = await axios.post(`${API_URL}/talk`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
