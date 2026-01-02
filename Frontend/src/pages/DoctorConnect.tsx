import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { Doctor } from '../types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

export default function DoctorConnect() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const data = await ApiService.getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error("Failed to load doctors", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto pt-24 h-full overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="h1-display mb-2">Find a Specialist</h1>
                        <p className="text-sana-text-muted text-sm max-w-lg">Connect with certified therapists and mental health professionals who specialize in your needs.</p>
                    </div>
                    <button
                        onClick={() => navigate('/appointments')}
                        className="glass-button-secondary"
                    >
                        My Appointments
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="loader"></div>
                        <p className="text-white/40 text-sm animate-pulse">Finding the best matches for you...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {doctors.map(doctor => (
                            <div key={doctor.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                                {/* Decorative Gradient Blob */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-sana-primary/10 rounded-full blur-2xl group-hover:bg-sana-primary/20 transition-all duration-500"></div>

                                <div className="flex items-start gap-4 mb-5 relative z-10">
                                    <div className="relative">
                                        <img
                                            src={doctor.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`}
                                            alt={doctor.name}
                                            className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${doctor.availability_status === 'Available' ? 'bg-emerald-400' :
                                                doctor.availability_status === 'Busy' ? 'bg-amber-400' : 'bg-slate-400'
                                            }`}></div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-sana-primary transition-colors">{doctor.name}</h3>
                                        <p className="text-sana-primary/80 text-xs font-medium uppercase tracking-wider mb-1">{doctor.specialization}</p>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${doctor.availability_status === 'Available'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                                    : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                                }`}>
                                                {doctor.availability_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3 pt-4 border-t border-white/5 relative z-10">
                                    <button
                                        onClick={() => navigate(`/book-appointment?doctor=${doctor.id}&type=normal`)}
                                        className="flex-1 py-2.5 bg-sana-blue/40 hover:bg-sana-primary/20 border border-sana-primary/30 hover:border-sana-primary/50 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        Book Session
                                    </button>
                                    <button
                                        onClick={() => navigate(`/book-appointment?doctor=${doctor.id}&type=emergency`)}
                                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-sm font-medium transition-all duration-300 hover:text-rose-200"
                                    >
                                        Urgent
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
