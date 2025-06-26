import { MdCall, MdCallEnd, MdVideoCall, MdMissedVideoCall } from "react-icons/md";
import moment from "moment";

const CallMessageUI = ({ type, status, duration, startedAt }) => {
  const getIcon = () => {
    if (type === "audio") {
      return status === "missed" ? (
        <MdCallEnd className="text-red-500 text-lg" />
      ) : (
        <MdCall className="text-green-600 text-lg" />
      );
    }
    if (type === "video") {
      return status === "missed" ? (
        <MdMissedVideoCall className="text-red-500 text-lg" />
      ) : (
        <MdVideoCall className="text-blue-600 text-lg" />
      );
    }
    return null;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getIcon()}
      <div className="flex flex-col text-gray-700">
        <span className="capitalize">{`${type} call — ${status}`}</span>
        <span className="text-xs text-gray-500">
          {status === "answered" && duration
            ? `${Math.floor(duration / 60)}m ${duration % 60}s`
            : moment(startedAt).format("LT")}
        </span>
      </div>
    </div>
  );
};

export default CallMessageUI;