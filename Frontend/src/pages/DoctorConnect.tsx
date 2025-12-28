import { useRef } from "react";
import { startWebRTC, stopWebRTC } from "../services/webrtcService";

export default function DoctorConnect() {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    return (
        <div className="h-screen bg-black text-white flex flex-col">
            <div className="flex flex-1 gap-4 p-4">
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="w-1/2 rounded-xl bg-gray-900"
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="w-1/2 rounded-xl bg-gray-900"
                />
            </div>

            <div className="p-4 flex justify-center gap-4">
                <button
                    onClick={() =>
                        startWebRTC(
                            localVideoRef.current!,
                            remoteVideoRef.current!
                        )
                    }
                    className="px-6 py-2 bg-green-600 rounded-lg"
                >
                    Start Call
                </button>

                <button
                    onClick={stopWebRTC}
                    className="px-6 py-2 bg-red-600 rounded-lg"
                >
                    End Call
                </button>
            </div>
        </div>
    );
}
