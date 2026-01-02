import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, Loader } from 'lucide-react';

interface BookingOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    time?: string;
}

export function BookingOverlay({ isOpen, onClose, time }: BookingOverlayProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            const t1 = setTimeout(() => setStep(1), 800);
            const t2 = setTimeout(() => setStep(2), 2500);
            const t3 = setTimeout(() => setStep(3), 3500);
            const t4 = setTimeout(() => onClose(), 6500);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-1/2 right-8 -translate-y-1/2 w-80 glass-panel p-6 rounded-3xl animate-fade-in-right z-40 border border-sana-primary/30 shadow-2xl">
            <h3 className="text-white font-display text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sana-primary" />
                Scheduling
            </h3>

            <div className="space-y-4">
                {/* Step 1: Checking */}
                <div className={`flex items-center gap-3 transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                        {step > 0 ? <CheckCircle className="w-5 h-5" /> : <Loader className="w-4 h-4 animate-spin" />}
                    </div>
                    <p className="text-sm text-sana-text-muted">Checking Dr. Mitchell's availablity...</p>
                </div>

                {/* Step 2: Booking */}
                {step >= 1 && (
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step > 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                            {step > 1 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-4 h-4 text-sana-secondary" />}
                        </div>
                        <p className="text-sm text-sana-text-muted">Booking for <span className="text-white font-medium">{time || '6:30 PM'}</span>...</p>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step >= 3 && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-2 ring-2 ring-emerald-500/30">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-white font-medium">Appointment Confirmed!</p>
                        <p className="text-xs text-sana-text-muted mt-1">A calendar invite has been sent.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
