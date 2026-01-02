import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/ApiService';
import { Doctor } from '../types';
import { Layout } from '../components/Layout';

export default function BookingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const doctorId = searchParams.get('doctor');
    const initialType = searchParams.get('type') as 'normal' | 'emergency' || 'normal';

    const [type, setType] = useState<'normal' | 'emergency'>(initialType);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');

    useEffect(() => {
        ApiService.getDoctors().then(setDoctors);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let scheduledTime = undefined;
            if (type === 'normal') {
                const [year, month, day] = date.split('-').map(Number);
                const [hours, minutes] = time.split(':').map(Number);
                const localDate = new Date(year, month - 1, day, hours, minutes);
                scheduledTime = localDate.toISOString();
            }

            await ApiService.bookAppointment(selectedDoctorId, type, scheduledTime);
            navigate('/appointments');
        } catch (error) {
            console.error("Booking failed", error);
            alert("Failed to book appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md glass-panel p-8 animate-fade-in-up">
                    <h2 className="text-2xl h1-display mb-6 text-center">
                        {type === 'emergency' ? 'Details for Urgent Request' : 'Schedule Appointment'}
                    </h2>

                    {selectedDoctor && (
                        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                            <img
                                src={selectedDoctor.image_url || `https://ui-avatars.com/api/?name=${selectedDoctor.name}`}
                                className="w-14 h-14 rounded-full border-2 border-white/10 shadow-lg"
                                alt=""
                            />
                            <div>
                                <p className="text-white font-bold text-lg">{selectedDoctor.name}</p>
                                <p className="text-sm text-sana-primary">{selectedDoctor.specialization}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!selectedDoctorId && (
                            <div>
                                <label className="block text-xs uppercase font-bold tracking-wider text-sana-text-muted mb-2">Select Specialist</label>
                                <select
                                    className="glass-input w-full"
                                    value={selectedDoctorId}
                                    onChange={e => setSelectedDoctorId(e.target.value)}
                                    required
                                >
                                    <option value="" className="text-slate-900">Choose a doctor...</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id} className="text-slate-900">{d.name} ({d.specialization})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                            <button
                                type="button"
                                onClick={() => setType('normal')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'normal' ? 'bg-sana-primary text-white shadow-lg' : 'text-sana-text-muted hover:text-white'
                                    }`}
                            >
                                Schedule
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('emergency')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'emergency' ? 'bg-rose-500 text-white shadow-lg' : 'text-sana-text-muted hover:text-white'
                                    }`}
                            >
                                Urgent Request
                            </button>
                        </div>

                        {type === 'normal' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-bold tracking-wider text-sana-text-muted mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="glass-input w-full"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold tracking-wider text-sana-text-muted mb-2">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="glass-input w-full"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {type === 'emergency' && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-200 animate-pulse-slow">
                                <p className="font-bold mb-1 flex items-center gap-2">⚠️ Emergency Request Protocol</p>
                                <p className="opacity-80">This will notify the doctor immediately. Please only use this for urgent situations requiring immediate attention.</p>
                                <p className="mt-2 text-xs opacity-60">Does not replace 911/112 services.</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !selectedDoctorId}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${type === 'emergency'
                                ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:shadow-rose-500/25'
                                : 'glass-button'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Processing...' : (type === 'emergency' ? 'Send Urgent Request' : 'Confirm Booking')}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
