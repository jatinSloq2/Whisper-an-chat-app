import React, { useEffect, useRef } from "react";
import { useCall } from "@/context/CallContext";

const CallAudio = () => {
  const { localAudio, remoteAudio } = useCall();

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local audio (muted to avoid feedback loop)
  useEffect(() => {
    if (localAudioRef.current && localAudio instanceof MediaStream) {
      localAudioRef.current.srcObject = localAudio;
    }
  }, [localAudio]);

  // Attach remote audio
  useEffect(() => {
    if (remoteAudioRef.current && remoteAudio instanceof MediaStream) {
      remoteAudioRef.current.srcObject = remoteAudio;
    }
  }, [remoteAudio]);

  return (
    <>
      {/* Hidden local audio (muted to avoid loopback) */}
      <audio ref={localAudioRef} autoPlay muted playsInline aria-hidden="true" />

      {/* Remote audio (audible) */}
      <audio ref={remoteAudioRef} autoPlay playsInline aria-label="Remote audio" />
    </>
  );
};

export default CallAudio;
