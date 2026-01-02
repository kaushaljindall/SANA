export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    availability_status: 'Available' | 'Busy' | 'Offline';
    image_url?: string;
}

export interface Appointment {
    id: string;
    doctor_id: string;
    type: 'normal' | 'emergency';
    scheduled_time: string | null;
    status: 'requested' | 'booked' | 'live' | 'completed' | 'cancelled';
    created_at: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'patient' | 'doctor';
}

export interface Reply {
    id: string;
    content: string;
    timestamp: string;
}

export interface Post {
    id: string;
    content: string;
    preview?: string; // Optional on frontend if derived
    timestamp: string; // Map to created_at from backend
    replies: Reply[];
    likes: number;
    color: string;
}
