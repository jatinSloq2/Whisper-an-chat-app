import { useEffect, useState } from "react";

const MessageSkeleton = () => {
  const [skeletonCount, setSkeletonCount] = useState(10);

  useEffect(() => {
    const updateSkeletonCount = () => {
      // Estimate height per skeleton item (adjust as needed)
      const itemHeight = 60; // px (message + timestamp + margin)
      const availableHeight = window.innerHeight - 160; // subtract header/footer if any
      const count = Math.floor(availableHeight / itemHeight);
      setSkeletonCount(count > 3 ? count : 4); // fallback minimum
    };

    updateSkeletonCount();
    window.addEventListener("resize", updateSkeletonCount);

    return () => {
      window.removeEventListener("resize", updateSkeletonCount);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-end overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-3">
        {[...Array(skeletonCount)].map((_, i) => {
          const isSender = i % 2 !== 0;

          return (
            <div
              key={i}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[70%]">
                <div
                  className={`h-5 w-[80%] px-4 py-3 animate-pulse rounded-xl shadow-sm ${
                    isSender ? "bg-purple-200" : "bg-gray-300"
                  }`}
                ></div>

                <div className="text-xs mt-1 flex justify-end items-center gap-1 px-1">
                  <div className="h-3 w-12 bg-gray-200 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageSkeleton;
