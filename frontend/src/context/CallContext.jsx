import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import { useUI } from "./UIcontext";
import { toast } from "sonner";

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

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const callActive = useRef(false);
  const incomingCallTimeoutRef = useRef(null);
  const iceQueue = useRef([]);

  const debug = (...args) =>
    console.log("%c[Call Debug]", "color: cyan", ...args);

  const logCall = ({
    sender,
    recipient,
    type,
    status,
    startedAt,
    endedAt,
    duration = 0,
  }) => {
    const now = new Date();
    socket.emit("store-call-log", {
      sender,
      recipient,
      messageType: type,
      callDetails: {
        duration,
        startedAt: startedAt || now,
        endedAt: endedAt || now,
        status,
      },
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
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) toast.error("No audio input detected.");
      else debug("🎧 Audio settings:", audioTracks[0].getSettings());
      return stream;
    } catch (err) {
      toast.error("Permission denied or no media device.");
      console.error("🎙️ Media error:", err);
      return null;
    }
  };

  const applyQueuedCandidates = async () => {
    for (const candidate of iceQueue.current) {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        debug("✅ Applied queued ICE candidate");
      } catch (err) {
        console.warn("❌ Failed to apply queued ICE:", err);
      }
    }
    iceQueue.current = [];
  };

  const initPeerConnection = (toUserId) => {
    peerConnection.current
      ?.getSenders?.()
      .forEach((s) => peerConnection.current.removeTrack(s));
    peerConnection.current?.close?.();

    const pc = new RTCPeerConnection({
      iceServers: STUN_TURN_SERVERS,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      sdpSemantics: "unified-plan",
    });

    peerConnection.current = pc;
    remoteStream.current = new MediaStream();
    setRemoteStreamState(remoteStream.current);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("ice-candidate", { to: toUserId, candidate });
        debug("Sent ICE candidate:", candidate);
      }
    };

    pc.ontrack = ({ streams }) => {
      streams[0]
        ?.getTracks()
        .forEach((track) => remoteStream.current.addTrack(track));
      setRemoteStreamState(
        new MediaStream([...remoteStream.current.getTracks()])
      );
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      debug("ICE state:", state);
      if (["disconnected", "failed"].includes(state)) {
        toast.error("Connection lost. Ending call.");
        endCall();
      }
    };
  };

  const continueStartCall = async (toUserId, type, stream) => {
    try {
      initPeerConnection(toUserId);
      setCallType(type);
      setPeerId(toUserId);
      localStream.current = stream;
      localStream.current.activeStartTime = new Date(); // 🔥 Timestamp
      callActive.current = true;
      setInCall(true);

      const tracks =
        type === "video" ? stream.getTracks() : stream.getAudioTracks();
      tracks.forEach((track) => peerConnection.current.addTrack(track, stream));

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer,
      });

      debug("📞 Call offer sent");
    } catch (err) {
      console.error("❌ startCall failed:", err);
      toast.error("Could not start the call.");
      endCall();
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = useCallback(
    async (toUserId, type = "audio") => {
      setIsLoading(true);
      socket.emit(
        "check-user-availability",
        { to: toUserId },
        async (response) => {
          if (!response?.online) {
            logCall({
              sender: userInfo.id,
              recipient: toUserId,
              type,
              status: "missed",
            });
            toast.error("User is not available or offline.");
            setIsLoading(false);
            return;
          }

          const stream = await getSafeUserMedia({ video: type === "video" });
          if (!stream) {
            setIsLoading(false);
            return;
          }

          await continueStartCall(toUserId, type, stream);
        }
      );
    },
    [socket, userInfo, setIsLoading]
  );

  const answerCall = useCallback(
    async ({ from, offer, type }) => {
      setIsLoading(true);
      const stream = await getSafeUserMedia({ video: type === "video" });
      if (!stream || !offer?.sdp) return setIsLoading(false);

      try {
        initPeerConnection(from);
        setCallType(type);
        setPeerId(from);
        localStream.current = stream;
        localStream.current.activeStartTime = new Date(); // 🔥 Timestamp
        callActive.current = true;
        setInCall(true);

        const tracks =
          type === "video" ? stream.getTracks() : stream.getAudioTracks();
        tracks.forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await applyQueuedCandidates();

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer-call", { to: from, answer });
        setCallAccepted(true);
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      } catch (err) {
        console.error("❌ answerCall failed:", err);
        toast.error("Call failed to connect.");
        endCall();
      } finally {
        setIsLoading(false);
      }
    },
    [socket, userInfo, setIsLoading]
  );

  const endCall = useCallback(() => {
    if (!callActive.current && !incomingCall) return;

    const end = new Date();
    const start = localStream.current?.activeStartTime || end;
    const duration = callAccepted ? Math.floor((end - start) / 1000) : 0;

    logCall({
      sender: userInfo.id,
      recipient: peerId || incomingCall?.from,
      type: callType,
      status: callAccepted ? "answered" : incomingCall ? "missed" : "rejected",
      startedAt: start,
      endedAt: end,
      duration,
    });

    callActive.current = false;
    peerConnection.current?.close?.();
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());

    localStream.current = null;
    remoteStream.current = null;

    setInCall(false);
    setIncomingCall(null);
    setPeerId(null);
    setCallAccepted(false);
    setCallType(null);
    setRemoteStreamState(null);
    clearTimeout(incomingCallTimeoutRef.current);

    socket.emit("end-call", {
      to: peerId || incomingCall?.from,
      from: userInfo.id,
    });
  }, [socket, userInfo, peerId, incomingCall, callAccepted, callType]);

  const replaceVideoTrack = async (newTrack) => {
    try {
      const sender = peerConnection.current
        ?.getSenders()
        ?.find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newTrack);
        debug("🔄 Video track replaced");
      }
    } catch (err) {
      console.error("❌ Failed to replace video track:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (inCall) {
        socket.emit("user-busy", { to: from });
        return;
      }
      setIncomingCall({ from, offer, type });

      incomingCallTimeoutRef.current = setTimeout(() => {
        logCall({
          sender: from,
          recipient: userInfo.id,
          type,
          status: "missed",
        });
        setIncomingCall(null);
        toast.info("Call timed out.");
        endCall();
      }, 30000);
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          await applyQueuedCandidates();
          setCallAccepted(true);
          debug("📲 Call connected");
        }
      } catch (err) {
        console.error("❌ Remote answer failed:", err);
      }
    });

    socket.on("user-busy", ({ to }) => {
      if (to === userInfo.id) {
        logCall({
          sender: userInfo.id,
          recipient: peerId,
          type: callType,
          status: "missed",
        });
        toast.error("User is currently on another call.");
        setIsLoading(false);
        endCall();
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (peerConnection.current?.remoteDescription) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          debug("✅ Added ICE candidate");
        } else {
          iceQueue.current.push(candidate);
          debug("🕒 Queued ICE candidate");
        }
      } catch (err) {
        console.warn("⚠️ ICE candidate error:", err);
      }
    });

    socket.on("call-ended", endCall);

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
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
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
