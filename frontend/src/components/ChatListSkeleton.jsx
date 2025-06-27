const ChatListSkeleton = () => {
  return (
    <div className="">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="cursor-pointer flex items-center gap-4 px-4 py-3 transition-all duration-200 border-b-1 border-gray-300 animate-pulse"
        >
          {/* Avatar Skeleton */}
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 shadow-sm border border-white/10" />

          {/* Contact Info Skeleton */}
          <div className="flex-1 overflow-hidden">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          </div>

          {/* Time Skeleton */}
          <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
};

export default ChatListSkeleton;