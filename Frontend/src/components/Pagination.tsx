"use client"

const Pagination = ({ 
  page = 1, 
  totalPages = 1, 
  onPageChange 
}: { 
  page?: number; 
  totalPages?: number; 
  onPageChange?: (page: number) => void;
}) => {
  const handlePrev = () => {
    if (page > 1 && onPageChange) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages && onPageChange) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNum: number) => {
    if (onPageChange) {
      onPageChange(pageNum);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
        <button 
          onClick={handlePrev}
          disabled={page === 1}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300"
        >
          Prev
        </button>
        <div className="flex items-center gap-2 text-sm">
            {getPageNumbers().map((pageNum, idx) => (
              pageNum === "..." ? (
                <span key={`ellipsis-${idx}`}>...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum as number)}
                  className={`px-2 rounded-sm ${
                    page === pageNum ? "bg-lamaSky" : "hover:bg-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              )
            ))}
        </div>
        <button 
          onClick={handleNext}
          disabled={page === totalPages}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300"
        >
          Next
        </button>
    </div>
  )
}

export default Pagination