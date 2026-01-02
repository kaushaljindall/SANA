import { create } from 'zustand';

interface UserState {
    authenticated: boolean;
    name: string | null;
    setAuthenticated: (auth: boolean) => void;
    setName: (name: string | null) => void;
}

interface VoiceState {
    listening: boolean;
    speaking: boolean;
    muted: boolean;
    setListening: (listening: boolean) => void;
    setSpeaking: (speaking: boolean) => void;
    setMuted: (muted: boolean) => void;
}

interface AgentState {
    status: 'idle' | 'processing' | 'executing_action';
    setStatus: (status: 'idle' | 'processing' | 'executing_action') => void;
}

interface AppointmentDetails {
    doctorId?: string;
    doctorName?: string;
    time?: string;
}

interface AppointmentState {
    status: 'none' | 'booking_in_progress' | 'booked' | 'upcoming_appointment';
    details: AppointmentDetails | null;
    setStatus: (status: 'none' | 'booking_in_progress' | 'booked' | 'upcoming_appointment') => void;
    setDetails: (details: AppointmentDetails | null) => void;
}

interface CallState {
    status: 'idle' | 'ringing' | 'live' | 'ended';
    setStatus: (status: 'idle' | 'ringing' | 'live' | 'ended') => void;
}

interface AppState {
    user: UserState;
    voice: VoiceState;
    agent: AgentState;
    appointment: AppointmentState;
    call: CallState;
    emergencyMode: boolean;

    setEmergencyMode: (mode: boolean) => void;

    // Actions to update nested state conveniently
    updateUser: (updates: Partial<Omit<UserState, 'setAuthenticated' | 'setName'>>) => void;
    updateVoice: (updates: Partial<Omit<VoiceState, 'setListening' | 'setSpeaking' | 'setMuted'>>) => void;
    updateAgent: (status: AgentState['status']) => void;
    updateAppointment: (status: AppointmentState['status'], details?: AppointmentDetails) => void;
    updateCall: (status: CallState['status']) => void;
}

export const useStore = create<AppState>((set) => ({
    user: {
        authenticated: false,
        name: null,
        setAuthenticated: (auth) => set((state) => ({ user: { ...state.user, authenticated: auth } })),
        setName: (name) => set((state) => ({ user: { ...state.user, name } })),
    },
    voice: {
        listening: false,
        speaking: false,
        muted: false,
        setListening: (listening) => set((state) => ({ voice: { ...state.voice, listening } })),
        setSpeaking: (speaking) => set((state) => ({ voice: { ...state.voice, speaking } })),
        setMuted: (muted) => set((state) => ({ voice: { ...state.voice, muted } })),
    },
    agent: {
        status: 'idle',
        setStatus: (status) => set((state) => ({ agent: { ...state.agent, status } })),
    },
    appointment: {
        status: 'none',
        details: null,
        setStatus: (status) => set((state) => ({ appointment: { ...state.appointment, status } })),
        setDetails: (details) => set((state) => ({ appointment: { ...state.appointment, details } })),
    },
    call: {
        status: 'idle',
        setStatus: (status) => set((state) => ({ call: { ...state.call, status } })),
    },
    emergencyMode: false,
    setEmergencyMode: (mode) => set({ emergencyMode: mode }),

    // Convenience updaters
    updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    updateVoice: (updates) => set((state) => ({ voice: { ...state.voice, ...updates } })),
    updateAgent: (status) => set((state) => ({ agent: { ...state.agent, status } })),
    updateAppointment: (status, details) => set((state) => ({
        appointment: {
            ...state.appointment,
            status,
            details: details !== undefined ? (details || null) : state.appointment.details
        }
    })),
    updateCall: (status) => set((state) => ({ call: { ...state.call, status } })),
}));
