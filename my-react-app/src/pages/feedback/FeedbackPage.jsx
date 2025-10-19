import React, { useState } from 'react';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const Data = ['Readability', 'Performance', 'Security', 'Documentation', 'Testing'];
  const [RealTimeData, setRealTimeData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const handleUpOrDown = i => {
    console.log('Button clicked:', i); // 调试用
    setRealTimeData(j => {
      return j.map((h, idx) => {
        if (idx === i) {
          return h + 1;
        }
        return h;
      });
    });
  };

  return (
    <div className="my-0 mx-auto text-center w-mx-1200">
      <div className="flex wrap justify-content-center mt-30 gap-30">
        {Data.map((i, idx) => (
          <div key={idx} className="pa-10 w-300 card">
            <h2>{i}</h2>
            <div className="flex my-30 mx-0 justify-content-around">
              <button
                className="py-10 px-15"
                data-testid={`upvote-btn-${idx}`}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpOrDown(idx * 2);
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  handleUpOrDown(idx * 2);
                }}
              >
                👍 Upvote
              </button>
              <button
                className="py-10 px-15 danger"
                data-testid={`downvote-btn-${idx}`}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpOrDown(idx * 2 + 1);
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  handleUpOrDown(idx * 2 + 1);
                }}
              >
                👎 Downvote
              </button>
            </div>
            <p className="my-10 mx-0" data-testid={`upvote-count-${idx}`}>
              Upvotes: <strong>{RealTimeData[idx * 2]}</strong>
            </p>
            <p className="my-10 mx-0" data-testid={`downvote-count-${idx}`}>
              Downvotes: <strong>{RealTimeData[idx * 2 + 1]}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPage;
