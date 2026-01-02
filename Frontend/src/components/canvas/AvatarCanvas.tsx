import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { Suspense } from 'react';

interface AvatarCanvasProps {
    audioUrl: string | null;
    expression?: string;
}

export function AvatarCanvas({ audioUrl, expression = 'default' }: AvatarCanvasProps) {
    return (
        <Canvas
            shadows
            dpr={window.devicePixelRatio}
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 4.5], fov: 40 }}
            style={{ width: '100%', height: '100%' }}
        >
            <Suspense fallback={null}>
                <Scene
                    audioUrl={audioUrl}
                    expression={expression}
                    animation={audioUrl ? "Talking" : "Idle"}
                    animationTrigger={Date.now()}
                />
            </Suspense>
        </Canvas>
    );
}
