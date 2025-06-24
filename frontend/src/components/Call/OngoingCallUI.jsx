import React, { useEffect, useRef } from "react";
import { useCall } from "@/context/CallContext";

const OngoingCallUI = () => {
  const { inCall, endCall, localStream, remoteStream } = useCall();
  const localRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }

    if (remoteStream.current) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream.current;
      }
    }
  }, [inCall, localStream, remoteStream]);

  if (!inCall) return null;

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl mb-4">📞 In Call</h2>
      <div className="flex gap-4 items-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-[300px] h-[200px] bg-gray-700 rounded"
        />
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="w-[150px] h-[100px] bg-gray-600 rounded"
        />
      </div>

      {/* Hidden audio element to ensure remote voice plays */}
      <audio ref={remoteAudioRef} autoPlay hidden />

      <button
        onClick={endCall}
        className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-2 rounded text-white"
      >
        End Call
      </button>
    </div>
  );
};

export default OngoingCallUI;
