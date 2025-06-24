import React, { useEffect, useRef } from "react";
import { useCall } from "@/context/CallContext";

const CallAudio = () => {
  const { localAudio, remoteAudio } = useCall();

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local audio stream
  useEffect(() => {
    if (localAudioRef.current && localAudio) {
      localAudioRef.current.srcObject = localAudio;
    }
  }, [localAudio]);

  // Attach remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && remoteAudio) {
      remoteAudioRef.current.srcObject = remoteAudio;
    }
  }, [remoteAudio]);

  return (
    <>
      {/* Hidden audio elements */}
      <audio ref={localAudioRef} autoPlay muted playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </>
  );
};

export default CallAudio;
