import { useCall } from "@/context/CallContext";

const IncomingCallUI = () => {
  const { incomingCall, answerCall, endCall } = useCall();
  console.log("📲 IncomingCallUI incomingCall state:", incomingCall);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
  <div className="bg-white p-6 rounded shadow-lg text-black">
    <h2 className="text-lg font-semibold">📞 Incoming {incomingCall.type} Call</h2>
    <p className="text-sm mt-2">From: {incomingCall.from}</p>
    <div className="flex mt-4 gap-4">
      <button
        onClick={() => answerCall(incomingCall)}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Accept
      </button>
      <button
        onClick={endCall}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Reject
      </button>
    </div>
  </div>
</div>
  );
};

export default IncomingCallUI;
