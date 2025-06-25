import { useCall } from "@/context/CallContext";

const CallButtons = ({ recipientId }) => {
  const { startCall } = useCall();

  const handleCall = (type) => {
    if (!recipientId) return;
    startCall(recipientId, type);
  };

  return (
    <div className="flex gap-3 items-center">
      {/* Audio Call Button */}
      <button
        onClick={() => handleCall("audio")}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
        title="Audio Call"
        aria-label="Audio Call"
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
