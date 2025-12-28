// @ts-nocheck
import { OrbitControls } from "@react-three/drei";
import { Ziva } from "./Ziva";
import { Suspense } from "react";

export const Scene = ({ audioUrl, expression, animation, animationTrigger }) => {
    return (
        <>
            {/* Camera Controls - Restricted movement for "Studio" feel */}
            <OrbitControls
                enablePan={false}
                minPolarAngle={1.2}
                maxPolarAngle={1.6} // Limit vertical movement to keep eye level
                minAzimuthAngle={-0.5}
                maxAzimuthAngle={0.5} // Limit horizontal rotation
                target={[0, 0, 0]} // Focus on the face
                enableZoom={false}
            />

            {/* Lighting Setup - Studio Dramatic */}
            <ambientLight intensity={0.4} color="#ccccff" />

            {/* Key Light (Warm, from right) */}
            <spotLight
                position={[2, 2, 2]}
                intensity={80}
                angle={0.5}
                penumbra={1}
                color="#fff0dd"
                castShadow
            />

            {/* Fill Light (Cool, from left) */}
            <spotLight
                position={[-2, 1, 2]}
                intensity={25}
                angle={0.6}
                color="#dbeeff"
            />

            {/* Rim Light (Bright, from behind for separation) */}
            <spotLight
                position={[0, 2, -2]}
                intensity={80}
                color="#ffffff"
            />

            {/* Avatar - Bust shot (upper body only) */}
            <Suspense fallback={null}>
                <group position={[0, -2.6, 0]} scale={2} rotation={[0, 0, 0]}>
                    <Ziva
                        audioUrl={audioUrl}
                        expression={expression}
                        animation={animation}
                        animationTrigger={animationTrigger}
                    />
                </group>
            </Suspense>
        </>
    );
};
