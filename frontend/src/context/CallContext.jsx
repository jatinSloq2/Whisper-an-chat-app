import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();

  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);

  const [localAudio, setLocalAudio] = useState(null);
  const [remoteAudio, setRemoteAudio] = useState(null);

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const initPeerConnection = (toUserId, type) => {
  peerConnection.current = new RTCPeerConnection(iceServers);

  peerConnection.current.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        to: toUserId,
        candidate: event.candidate,
      });
    }
  };

  peerConnection.current.ontrack = (event) => {
    const remoteStreamObject = event.streams[0];
    remoteStream.current = remoteStreamObject;
    setRemoteAudio(remoteStreamObject);

    // Optional: attach to HTML video/audio elements
    const remoteAudioEl = document.getElementById("remote-audio");
    if (remoteAudioEl) remoteAudioEl.srcObject = remoteStreamObject;

    const remoteVideoEl = document.getElementById("remote-video");
    if (remoteVideoEl) remoteVideoEl.srcObject = remoteStreamObject;
  };
};


  const setupPeerConnection = async (toUserId, type) => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    setLocalAudio(localStream.current);

    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: toUserId,
          candidate: e.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (e) => {
      remoteStream.current = e.streams[0];
      setRemoteAudio(e.streams[0]);
    };

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });
  };
const startCall = async (toUserId, type = "video") => {
  try {
    console.log("📞 Starting call to:", toUserId, "| Type:", type);

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    setLocalAudio(localStream.current);

    const localVideoEl = document.getElementById("local-video");
    if (localVideoEl) localVideoEl.srcObject = localStream.current;

    initPeerConnection(toUserId, type);

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("call-user", {
      from: userInfo.id,
      to: toUserId,
      type,
      offer,
    });

    setInCall(true);
  } catch (error) {
    console.error("❌ startCall error:", error);
  }
};




 const answerCall = async ({ from, offer, type }) => {
  try {
    if (!offer?.type || !offer?.sdp) {
      console.error("❌ Invalid offer received");
      return;
    }

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    setLocalAudio(localStream.current);

    const localVideoEl = document.getElementById("local-video");
    if (localVideoEl) localVideoEl.srcObject = localStream.current;

    initPeerConnection(from, type);

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answer-call", {
      to: from,
      answer: peerConnection.current.localDescription,
    });

    setInCall(true);
  } catch (error) {
    console.error("❌ answerCall error:", error);
  }
};


  const endCall = () => {
    peerConnection.current?.close();
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;

    remoteStream.current = null;

    setInCall(false);
    setIncomingCall(null);
    setLocalAudio(null);
    setRemoteAudio(null);

    socket.emit("end-call", { to: incomingCall?.from });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      console.log("📲 Incoming call from:", from);
      if (!offer?.type || !offer?.sdp) {
        console.warn("⚠️ Invalid offer received");
        return;
      }
      setIncomingCall({ from, offer, type });
    });

    socket.on("call-answered", async ({ answer }) => {
      if (!answer?.type || !answer?.sdp) {
        console.warn("⚠️ Invalid answer received");
        return;
      }
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate) {
        peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-ended", () => {
      console.log("📴 Call ended remotely");
      endCall();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket, incomingCall]);

  return (
    <CallContext.Provider
      value={{
        inCall,
        incomingCall,
        startCall,
        answerCall,
        endCall,
        localStream,
        remoteStream,
        localAudio,
        remoteAudio,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
