import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { Appointment } from '../types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Calendar, Clock, Video, CheckCircle, XCircle, ArrowRight, Plus } from 'lucide-react';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await ApiService.getAppointments();
            // Sort by schedule time (nearest first) for upcoming, and created_at desc for others
            setAppointments(data);
        } catch (error) {
            console.error("Failed to load appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Immediate / ASAP';
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
            timeZoneName: 'short'
        });
    };

    const upcomingAppointments = appointments.filter(a => ['requested', 'booked', 'live'].includes(a.status)).sort((a, b) => {
        if (!a.scheduled_time) return -1;
        if (!b.scheduled_time) return 1;
        return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
    });

    const pastAppointments = appointments.filter(a => ['completed', 'cancelled'].includes(a.status)).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <Layout showHeader={false}>
            {/* The Layout component now handles the global background, so we just set h-full */}
            <div className="relative w-full h-full text-sana-text font-sans">

                {/* Scrollable Container */}
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                            <div>
                                <h1 className="h1-display text-4xl mb-2">
                                    Patient Lobby
                                </h1>
                                <p className="text-sana-text-muted text-sm tracking-wide uppercase font-medium">
                                    Manage your sessions & history
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/doctor-connect')}
                                className="glass-button flex items-center gap-2 px-6 py-3 rounded-full"
                            >
                                <Plus className="w-5 h-5" />
                                <span>New Session</span>
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="loader w-12 h-12"></div>
                                <p className="text-white/30 text-sm animate-pulse">Syncing with Lobby...</p>
                            </div>
                        ) : (
                            <div className="space-y-16">

                                {/* UPCOMING SESSIONS */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-sana-primary/20 flex items-center justify-center border border-sana-primary/30">
                                            <Calendar className="w-4 h-4 text-sana-primary" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white/90">Upcoming Sessions</h2>
                                        <span className="bg-white/10 text-white/60 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                            {upcomingAppointments.length}
                                        </span>
                                    </div>

                                    {upcomingAppointments.length === 0 ? (
                                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Calendar className="w-8 h-8 text-white/20" />
                                            </div>
                                            <h3 className="text-white font-medium mb-1">No upcoming sessions</h3>
                                            <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                                                Your schedule is clear. Book a session with a specialist to get started.
                                            </p>
                                            <button
                                                onClick={() => navigate('/doctor-connect')}
                                                className="text-sana-primary hover:text-sana-accent text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                                            >
                                                Find a Doctor <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {upcomingAppointments.map(appt => (
                                                <div key={appt.id} className="glass-card group relative overflow-hidden p-0">
                                                    {/* Accent Line */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${appt.type === 'emergency' ? 'bg-gradient-to-b from-rose-500 to-red-600' : 'bg-gradient-to-b from-blue-500 to-purple-600'
                                                        }`}></div>

                                                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pl-8">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                {appt.status === 'live' ? (
                                                                    <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Live Now
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-white/5 text-white/40 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                                        {appt.status}
                                                                    </span>
                                                                )}
                                                                {appt.type === 'emergency' && (
                                                                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                                        Urgent
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-start gap-4">
                                                                <div className="flex-1">
                                                                    <h3 className="text-2xl text-white font-medium mb-1">
                                                                        {appt.scheduled_time ? new Date(appt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                                                        <Calendar className="w-4 h-4" />
                                                                        <span>
                                                                            {new Date(appt.scheduled_time || new Date()).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                                            {(appt.status === 'requested' || appt.status === 'booked') && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                                                            try {
                                                                                await ApiService.cancelAppointment(appt.id);
                                                                                loadAppointments();
                                                                            } catch (e) {
                                                                                alert('Failed to cancel appointment');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-sm font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}

                                                            {appt.status === 'live' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Mark this session as completed?')) {
                                                                            try {
                                                                                await ApiService.completeAppointment(appt.id);
                                                                                loadAppointments();
                                                                            } catch (e) {
                                                                                alert('Failed to complete appointment');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-all text-sm font-medium"
                                                                >
                                                                    Mark Complete
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => navigate(`/session/${appt.id}`)}
                                                                disabled={appt.status !== 'live' && !(appt.status === 'booked' && appt.type === 'emergency')}
                                                                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${appt.status === 'live' || (appt.status === 'booked' && appt.type === 'emergency')
                                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-900/40 hover:shadow-blue-900/60 hover:translate-y-[-2px]'
                                                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                                                    }`}
                                                            >
                                                                {appt.status === 'live' ? (
                                                                    <>
                                                                        <Video className="w-5 h-5" /> Join Now
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Clock className="w-5 h-5" /> Waiting Room
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* HISTORY SESSIONS */}
                                {pastAppointments.length > 0 && (
                                    <section className="pb-20">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <Clock className="w-4 h-4 text-white/40" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white/90">History</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pastAppointments.map(appt => (
                                                <div key={appt.id} className="glass-card p-5 flex items-start justify-between min-h-[100px]">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {appt.status === 'completed' ? (
                                                                <span className="flex items-center gap-1 text-green-400/80 text-xs font-medium">
                                                                    <CheckCircle className="w-3 h-3" /> Completed
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-red-400/60 text-xs font-medium">
                                                                    <XCircle className="w-3 h-3" /> Cancelled
                                                                </span>
                                                            )}
                                                            <span className="text-white/20 text-xs">•</span>
                                                            <span className="text-white/40 text-xs uppercase">{appt.type}</span>
                                                        </div>
                                                        <p className="text-white/80 font-medium">{formatDate(appt.scheduled_time)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white/20 text-xs font-mono">ID: {appt.id.substring(0, 6)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
