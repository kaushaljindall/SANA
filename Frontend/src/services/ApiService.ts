import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ChatResponse {
    text: string;
    facialExpression: string;
    animation: string;
    audio: string | null; // Base64 audio url
    voiceId?: string;
    data?: {
        action: string;
        appointment_id?: string;
    };
}

export const ApiService = {
    async sendChat(message: string, sessionId: string = 'default'): Promise<ChatResponse> {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message,
                sessionId,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async sendVoice(audioBlob: Blob, sessionId: string = 'default'): Promise<ChatResponse> {
        const token = sessionStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', audioBlob, 'input.wav');
        formData.append('sessionId', sessionId);

        try {
            const response = await axios.post(`${API_URL}/talk`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Doctor & Appointment APIs
    async getDoctors(): Promise<import('../types').Doctor[]> {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_URL}/doctors`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async getAppointments(role: 'patient' | 'doctor' = 'patient'): Promise<import('../types').Appointment[]> {
        const token = sessionStorage.getItem('token');
        const endpoint = role === 'doctor' ? '/doctor/appointments' : '/appointments/patient';
        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async bookAppointment(doctorId: string, type: 'normal' | 'emergency', scheduledTime?: string): Promise<import('../types').Appointment> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/appointments`, {
            doctor_id: doctorId,
            type,
            scheduled_time: scheduledTime
        }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async startSession(appointmentId: string): Promise<import('../types').Appointment> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/appointments/${appointmentId}/start`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async cancelAppointment(appointmentId: string): Promise<import('../types').Appointment> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/appointments/${appointmentId}/cancel`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async completeAppointment(appointmentId: string): Promise<import('../types').Appointment> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/appointments/${appointmentId}/complete`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async getAppointmentDetails(appointmentId: string): Promise<import('../types').Appointment> {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    // Forum APIs
    async getPosts(): Promise<import('../types').Post[]> {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_URL}/forum/posts`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        // Map backend response to frontend Post type (handle timestamp/created_at difference)
        return response.data.map((post: any) => ({
            ...post,
            timestamp: new Date(post.created_at).toLocaleString(), // Convert backend created_at to timestamp string
            preview: post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content,
            replies: post.replies ? post.replies.map((r: any) => ({
                ...r,
                timestamp: r.created_at ? new Date(r.created_at).toLocaleString() : 'Just now'
            })) : []
        }));
    },

    async createPost(content: string, color: string): Promise<import('../types').Post> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/forum/posts`, { content, color }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const post = response.data;
        return {
            ...post,
            timestamp: "Just now",
            preview: post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content,
            replies: []
        };
    },

    async replyToPost(postId: string, content: string): Promise<import('../types').Reply> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/forum/posts/${postId}/reply`, { content }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const reply = response.data;
        return {
            ...reply,
            timestamp: "Just now"
        };
    },

    async likePost(postId: string): Promise<{ status: string, likes: number }> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/forum/posts/${postId}/like`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    // Assessment APIs
    async startAssessment(context?: string): Promise<any> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/assessment/start`, { context }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async submitAssessmentResponse(sessionId: string, responseText: string): Promise<any> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/assessment/response`, {
            session_id: sessionId,
            response_text: responseText
        }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async submitAssessmentVoice(sessionId: string, audioBlob: Blob): Promise<any> {
        const token = sessionStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', audioBlob, 'input.wav');
        formData.append('session_id', sessionId);

        const response = await axios.post(`${API_URL}/assessment/talk`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });
        return response.data;
    },

    // Weekly Assignment APIs
    async checkWeeklyDue(): Promise<{ due: boolean }> {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_URL}/assignments/check`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async startWeeklySession(): Promise<any> {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(`${API_URL}/assignments/start`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data;
    },

    async submitWeeklyResponse(sessionId: string, audioBlob: Blob): Promise<any> {
        const token = sessionStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', audioBlob, 'input.wav');
        formData.append('sessionId', sessionId);

        const response = await axios.post(`${API_URL}/assignments/response`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });
        return response.data;
    }
};
