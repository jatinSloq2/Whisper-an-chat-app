import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useUI } from "./UIcontext";

const CallContext = createContext();

const STUN_TURN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:global.relay.metered.ca:80",
      "turn:global.relay.metered.ca:443",
      "turn:global.relay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const CALL_TIMEOUT = 30000;
const DEBUG_MODE = true;
const debug = (...args) =>
  DEBUG_MODE && console.log("%c[Call Debug]", "color: cyan", ...args);
const handleError = (err, context = "Error") => {
  console.error(`[${context}]`, err);
  toast.error(`${context}: ${err?.message || "Unknown error"}`);
};

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();
  const { setIsLoading } = useUI();

  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [remoteStreamState, setRemoteStreamState] = useState(null);
  const [viewMode, setViewMode] = useState("default");

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const callActive = useRef(false);
  const incomingCallTimeoutRef = useRef(null);
  const iceQueue = useRef([]);
  const callLogSent = useRef(false);
  const callEndedByMe = useRef(false);

  const toggleViewMode = () =>
    setViewMode((prev) => (prev === "mini" ? "full" : "mini"));

  const logCall = ({
    sender,
    recipient,
    type,
    status,
    startedAt,
    endedAt,
    duration = 0,
  }) => {
    if (callLogSent.current) return debug("🚫 Duplicate log prevented");
    if (!type) {
      debug("⚠️ Skipping call log: messageType is undefined");
      return;
    }
    callLogSent.current = true;

    socket.emit("store-call-log", {
      sender,
      recipient,
      messageType: type || "audio",
      callDetails: { duration, startedAt, endedAt, status },
    });
  };

  const getSafeUserMedia = async ({ video }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video,
      });
      if (!stream.getAudioTracks().length)
        toast.error("No audio input detected.");
      return stream;
    } catch (err) {
      handleError(err, "Media access error");
      return null;
    }
  };

  const applyQueuedCandidates = async () => {
    for (const candidate of iceQueue.current) {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        handleError(err, "Apply ICE error");
      }
    }
    iceQueue.current = [];
  };

  const initPeerConnection = (toUserId) => {
    peerConnection.current?.close?.();
    peerConnection.current = new RTCPeerConnection({
      iceServers: STUN_TURN_SERVERS,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      sdpSemantics: "unified-plan",
    });

    peerConnection.current.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { to: toUserId, candidate });
    };

    peerConnection.current.ontrack = ({ streams }) => {
      remoteStream.current = streams[0];
      setRemoteStreamState(streams[0]);
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current.connectionState;
      if (["disconnected", "failed", "closed"].includes(state)) endCall();
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current.iceConnectionState;
      if (["disconnected", "failed"].includes(state)) endCall();
    };
  };

  const continueStartCall = async (toUserId, type, stream) => {
    try {
      initPeerConnection(toUserId);
      setCallType(type);
      setPeerId(toUserId);
      localStream.current = stream;
      localStream.current.activeStartTime = new Date();
      callActive.current = true;
      setInCall(true);

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer,
      });

      incomingCallTimeoutRef.current = setTimeout(() => {
        callEndedByMe.current = true;
        endCall();
        setIncomingCall(null);
        setCallAccepted(false);
        setInCall(false);
        setPeerId(null);
        toast.info("Call timed out.");
      }, CALL_TIMEOUT);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      handleError(err, "Start call error");
      endCall();
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = useCallback(
    async (toUserId, type = "audio") => {
      callEndedByMe.current = false;
      callLogSent.current = false;
      setIsLoading(true);

      socket.emit("check-user-availability", { to: toUserId }, async (res) => {
        if (!res?.online)
          return toast.error("User is not available."), setIsLoading(false);

        const stream = await getSafeUserMedia({ video: type === "video" });
        if (!stream) return setIsLoading(false);

        await continueStartCall(toUserId, type, stream);
      });
    },
    [socket, userInfo, setIsLoading]
  );

  const answerCall = useCallback(
    async ({ from, offer, type }) => {
      callEndedByMe.current = false;
      callLogSent.current = false;
      setIsLoading(true);

      const stream = await getSafeUserMedia({ video: type === "video" });
      if (!stream || !offer?.sdp) return setIsLoading(false);

      try {
        initPeerConnection(from);
        setCallType(type);
        setPeerId(from);
        localStream.current = stream;
        localStream.current.activeStartTime = new Date();
        callActive.current = true;
        setInCall(true);

        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await applyQueuedCandidates();
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("answer-call", { to: from, answer });
        setCallAccepted(true);
        clearTimeout(incomingCallTimeoutRef.current);
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        handleError(err, "Answer call error");
        endCall();
      } finally {
        setIsLoading(false);
      }
    },
    [socket, userInfo, setIsLoading]
  );

  const endCall = useCallback(() => {
    const isIncoming = !!incomingCall;
    const targetId = callAccepted
      ? peerId
      : isIncoming
      ? incomingCall?.from
      : null;

    if (!targetId) {
      debug("No valid peer to end call with.");
      return;
    }

    if (callEndedByMe.current) {
      debug("Call already ended by me. Skipping endCall.");
      return;
    }

    debug("Ending call now...");
    callEndedByMe.current = true;

    socket.emit("end-call", {
      to: targetId,
      from: userInfo.id,
    });

    const end = new Date();
    const start = localStream.current?.activeStartTime || end;
    const duration = callAccepted ? Math.floor((end - start) / 1000) : 0;
    const status = callAccepted
      ? "answered"
      : isIncoming
      ? "missed"
      : "rejected"; // important fix here for outgoing rejected case

    logCall({
      sender: userInfo.id,
      recipient: peerId || incomingCall?.from,
      type: callType,
      status,
      startedAt: start,
      endedAt: end,
      duration,
    });

    // Cleanup
    try {
      peerConnection.current?.close?.();
    } catch (err) {
      debug("Peer connection cleanup failed", err);
    }
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;

    callLogSent.current = true;
    callActive.current = false;
    callEndedByMe.current = false; // reset so next call can set again

    // State resets
    setInCall(false);
    setIncomingCall(null);
    setPeerId(null);
    setCallAccepted(false);
    setCallType(null);
    setRemoteStreamState(null);
    clearTimeout(incomingCallTimeoutRef.current);
  }, [socket, userInfo, peerId, incomingCall, callAccepted, callType]);

  const replaceVideoTrack = async (newTrack) => {
    try {
      const sender = peerConnection.current
        ?.getSenders()
        ?.find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);
    } catch (err) {
      handleError(err, "Replace video track error");
    }
  };

  useEffect(() => {
    const handleUnload = () => {
      if (callActive.current) {
        callEndedByMe.current = true;
        endCall();
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [endCall]);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (inCall || incomingCall || callActive.current) {
        debug("❌ Busy - rejecting call from", from);
        socket.emit("user-busy", { to: from });
        return;
      }

      setIncomingCall({ from, offer, type });

      incomingCallTimeoutRef.current = setTimeout(() => {
        callEndedByMe.current = true;
        endCall();
        setIncomingCall(null);
        setCallAccepted(false);
        setInCall(false);
        setPeerId(null);
        toast.info("Call timed out.");

        socket.emit("end-call", {
          to: from,
          from: userInfo.id,
        });
      }, CALL_TIMEOUT);
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (callAccepted) return;
        if (answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          await applyQueuedCandidates();
          setCallAccepted(true);
          clearTimeout(incomingCallTimeoutRef.current);
        }
      } catch (err) {
        handleError(err, "Remote answer failed");
      }
    });

    socket.on("user-busy", ({ to }) => {
      if (to === userInfo.id) {
        debug("📞 Received busy response from callee");
        callEndedByMe.current = true;
        endCall();
        setTimeout(() => {
          if (!callAccepted) endCall(); // Just in case it lingers
        }, 1000);

        toast.error("User is currently on another call.");
        setIsLoading(false);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (peerConnection.current?.signalingState === "stable") {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          iceQueue.current.push(candidate);
        }
      } catch (err) {
        handleError(err, "ICE candidate error");
      }
    });

    socket.on("call-ended", ({ from }) => {
      if (from !== peerId) {
        debug("❌ Ignoring call-ended from unrelated peer:", from);
        return;
      }

      callEndedByMe.current = false;
      endCall();
      toast.info("The other user has ended the call.");
    });

    socket.on("call-timeout", ({ from }) => {
      if (from !== peerId) return;
      toast.info("User didn't answer the call.");
      endCall();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("user-busy");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("call-timeout");
    };
  }, [socket, inCall, endCall]);

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
        callType,
        callAccepted,
        remoteStreamState,
        replaceVideoTrack,
        viewMode,
        setViewMode,
        toggleViewMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
