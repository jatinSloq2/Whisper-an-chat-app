import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();

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
  const iceQueue = useRef([]);

  const debug = (...args) =>console.log("%c[Call Debug]", "color: cyan", ...args);
  // const getIceServers = async () => {
  //   try {
  //     const { data } = await apiClient.get(
  //       "https://whisper-backend-kcj2.onrender.com/api/call/ice"
  //     );
  //     debug("Fetched ICE servers", data);
  //     return data.iceServers;
  //   } catch (err) {
  //     console.error("❌ ICE fetch failed:", err);
  //     return [{ urls: "stun:stun.l.google.com:19302" }];
  //   }
  // };

  const replaceVideoTrack = async (newTrack) => {
  try {
    const senders = peerConnection.current?.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === "video");
    if (videoSender) {
      await videoSender.replaceTrack(newTrack);
      debug("🔄 Video track replaced in peer connection");
    }
  } catch (err) {
    console.error("❌ Failed to replace video track:", err);
  }
};

  const getIceServers = async () => {
    return [
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
  };

  const validateAudioTracks = (stream) => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      toast.error("No audio input detected.");
      console.warn("⚠️ No audio tracks found in stream.");
    } else {
      const settings = audioTracks[0].getSettings();
      debug("🎧 Audio settings:", settings);
    }
  };

  const getSafeUserMedia = async (constraints) => {
    const defaultConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: constraints.video || false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        defaultConstraints
      );
      console.log(
        "🎤 Local Tracks:",
        stream.getTracks().map((t) => t.kind)
      );
      validateAudioTracks(stream);
      debug("Media stream acquired:", stream);
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

  const initPeerConnection = (toUserId, iceServers) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    if (peerConnection.current) {
      peerConnection.current
        .getSenders()
        .forEach((s) => peerConnection.current.removeTrack(s));
      peerConnection.current.close();
      peerConnection.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      sdpSemantics: "unified-plan",
    });

    peerConnection.current = pc;
    remoteStream.current = new MediaStream();
    setRemoteStreamState(remoteStream.current);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        const typeMatch = candidate.candidate.match(/typ\s(\w+)/);
        const type = typeMatch?.[1] || "unknown";
        console.log("📡 ICE Candidate Type:", type, "|", candidate.candidate);

        socket.emit("ice-candidate", { to: toUserId, candidate });
        debug("Sent ICE candidate:", candidate);
      }
    };

    pc.ontrack = ({ streams }) => {
      debug(
        "📥 Remote track received:",
        streams[0]?.getTracks()?.map((t) => t.kind)
      );
      streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
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
    let negotiationDone = false;

    pc.onnegotiationneeded = async () => {
      if (negotiationDone || !pc) return;
      negotiationDone = true;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-user", {
          from: userInfo.id,
          to: peerId,
          type: callType,
          offer,
        });
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };
  };

  const startCall = async (toUserId, type = "audio") => {
    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream) return;

    try {
      const iceServers = await getIceServers();
      initPeerConnection(toUserId, iceServers);

      setCallType(type);
      setPeerId(toUserId);
      localStream.current = stream;
      callActive.current = true;
      setInCall(true);

      if (type === "video") {
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
      } else {
        stream
          .getAudioTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
      }

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer, // Send early!
      });

      debug("📞 Call offer sent");
    } catch (err) {
      console.error("❌ startCall failed:", err);
      toast.error("Could not start the call.");
      endCall();
    }
  };

  const answerCall = async ({ from, offer, type }) => {
    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream || !offer?.sdp || !offer?.type) return;

    try {
      const iceServers = await getIceServers();
      initPeerConnection(from, iceServers);

      setCallType(type);
      setPeerId(from);
      localStream.current = stream;
      callActive.current = true;
      setInCall(true);

      if (type === "video") {
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
      } else {
        stream
          .getAudioTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      await applyQueuedCandidates(); // ✅ Handle delayed ICE

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: from,
        answer: peerConnection.current.localDescription,
      });

      setCallAccepted(true);
      debug("✅ Call answered");
    } catch (err) {
      console.error("❌ answerCall failed:", err);
      toast.error("Call failed to connect.");
      endCall();
    }
  };

  const endCall = () => {
    if (!callActive.current && !incomingCall) return;

    callActive.current = false;

    peerConnection.current?.close();
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

    if (socket && userInfo?.id) {
      socket.emit("end-call", {
        to: peerId || incomingCall?.from,
        from: userInfo.id,
      });
    }

    debug("📴 Call ended");
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (inCall) {
        socket.emit("user-busy", { to: from });
        return;
      }
      setIncomingCall({ from, offer, type });
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          await applyQueuedCandidates(); // ✅ Handle ICE
          setCallAccepted(true);
          debug("📲 Call connected");
        }
      } catch (err) {
        console.error("❌ Remote answer failed:", err);
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
  }, [socket]);

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
        replaceVideoTrack
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
