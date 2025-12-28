let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

const config: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" } // FREE, OK for now
    ]
};

export async function startWebRTC(
    localVideo: HTMLVideoElement,
    remoteVideo: HTMLVideoElement
) {
    // 1. Get camera + mic
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    localVideo.srcObject = localStream;

    // 2. Create peer connection
    pc = new RTCPeerConnection(config);

    // 3. Add tracks
    localStream.getTracks().forEach(track => {
        pc?.addTrack(track, localStream!);
    });

    // 4. Remote stream
    pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // 5. MOCK signaling (loopback for now)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await pc.setRemoteDescription(offer);
}

export function stopWebRTC() {
    pc?.close();
    pc = null;

    localStream?.getTracks().forEach(track => track.stop());
    localStream = null;
}
