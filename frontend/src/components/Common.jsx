const GenericSkeleton = ({ lines = 3 }) => {
  return (
    <div className="p-4 space-y-3">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 dark:bg-gray-700 animate-pulse rounded w-full" />
      ))}
    </div>
  );
};

export default GenericSkeleton;