import { useCall } from "@/context/CallContext";

const CallButtons = ({ recipientId }) => {
  const { startCall } = useCall();

  return (
    <div className="flex gap-2">
      <button onClick={() => startCall(recipientId, "audio")}>🔊</button>
      <button onClick={() => startCall(recipientId, "video")}>🎥</button>
    </div>
  );
};

export default CallButtons;