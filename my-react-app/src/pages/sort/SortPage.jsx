import { useState } from "react";
import Articles from "../../components/Articles";

// Sample data for testing
const sampleArticles = [
  {
    title: "A message to our customers",
    upvotes: 12,
    date: "2020-01-24"
  },
  {
    title: "Alphabet earnings",
    upvotes: 22,
    date: "2019-11-23"
  },
  {
    title: "Artificial Mountains",
    upvotes: 2,
    date: "2019-11-22"
  },
  {
    title: "What's SAP",
    upvotes: 1,
    date: "2019-11-21"
  },
  {
    title: "the Emu War",
    upvotes: 24,
    date: "2019-10-21"
  },
  {
    title: "Scaling to 100k Users",
    upvotes: 72,
    date: "2019-01-21"
  },
  {
    title: "Simple text editor has 15k monthly users",
    upvotes: 7,
    date: "2010-12-31"
  }
];

function SortPage({ articles = sampleArticles }) {
  // 初始化时按 upvotes 排序（不会修改原始 articles）
  const [sortedArticles, setSortedArticles] = useState(() =>
    [...articles].sort((a, b) => b.upvotes - a.upvotes)
  );

  const handleMostUpvoted = () => {
    const sorted = [...articles].sort((a, b) => b.upvotes - a.upvotes);
    setSortedArticles(sorted);
  };

  const handleMostRecent = () => {
    const sorted = [...articles].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setSortedArticles(sorted);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        Sorting Articles
      </h1>
      
      <div className="flex items-center justify-center gap-4 mb-8">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Sort By
        </label>
        <button
          data-testid="most-upvoted-link"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          onClick={handleMostUpvoted}
        >
          Most Upvoted
        </button>
        <button
          data-testid="most-recent-link"
          className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
          onClick={handleMostRecent}
        >
          Most Recent
        </button>
      </div>
      
      <Articles articles={sortedArticles} />
    </div>
  );
}

export default SortPage;
