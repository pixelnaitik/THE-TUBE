export default function Loading() {
  return (
    <div className="pt-4 animate-pulse">
      <div className="h-6 w-48 bg-[#272727] rounded-md mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex flex-col gap-3">
            <div className="w-full aspect-video bg-[#272727] rounded-xl"></div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#272727] shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-[#272727] rounded-md w-3/4 mb-2"></div>
                <div className="h-3 bg-[#272727] rounded-md w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
