import { useCall } from "@/context/CallContext";
import { toast } from "sonner";

const CallButtons = ({ recipientId }) => {
  const { startCall } = useCall();

  const requestMicAccess = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch (err) {
    toast.error("Microphone access denied. Please enable it in browser settings.");
    return false;
  }
};

  const handleCall = async (type) => {
  const allowed = await requestMicAccess(); // triggers user prompt
  if (!allowed || !recipientId) return;
  startCall(recipientId, type);
};

  if (!recipientId) {
    console.warn("❌ No recipient ID provided.");
    return;
  }

  return (
    <div className="flex gap-3 items-center">
      {/* Audio Call Button */}
      <button
        onClick={() => handleCall("audio")}
        disabled={!recipientId}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-white shadow-md transition ${
          recipientId
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        title="Audio Call"
      >
        🔊
      </button>

      {/* Video Call Button */}
      <button
        onClick={() => handleCall("video")}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md"
        title="Video Call"
        aria-label="Video Call"
      >
        🎥
      </button>
    </div>
  );
};

export default CallButtons;
