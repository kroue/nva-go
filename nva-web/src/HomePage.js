import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="HomePage">
      <div className="HomePage-grid">
        <div className="HomePage-titlebar">
          <h2 className="HomePage-titlebar-text">Home</h2>
        </div>
        <div className="HomePage-pickup">
          <h2 className="Dashboard-section-title dark">To be picked up</h2>
          <div className="Card">
            <p><strong>Kriz Cultura</strong></p>
            <span className="Card-subtext">Low Quality Tarpulin</span>
            <span className="Card-id">No. 203314</span>
          </div>
          <div className="Card"></div>
        </div>
        <div className="HomePage-welcome">
          <h1 className="HomePage-title">
            Welcome back, Aljohn! Here's what's happening today.
          </h1>
        </div>
        <div className="Dashboard-section HomePage-recent">
          <h2 className="Dashboard-section-title dark">Recent Transactions</h2>
          <div className="Card">
            <p><strong>Kharlo Edulan</strong></p>
            <span className="Card-subtext">High Quality Tarpulin</span>
            <span className="Card-id">No. 203313</span>
          </div>
        </div>
        <div className="HomePage-unread-sales-row">
          <div className="Dashboard-section HomePage-unread">
            <h2 className="Dashboard-section-title dark">Unread Messages</h2>
            <div className="Card"></div>
          </div>
          <div className="Dashboard-section HomePage-sales">
            <h2 className="Dashboard-section-title dark">Sales Today</h2>
            <div className="Card"></div>
          </div>
        </div>
        <div className="Dashboard-section HomePage-validate">
          <h2 className="Dashboard-section-title dark">Validate Payment</h2>
          <div className="Card">
            <p><strong>Kriz Cultura sent proof of Payment</strong></p>
            <span className="Card-subtext">Screenshot1023.jpg</span>
            <span className="Card-id">Gcash</span>
            <span className="Card-id">No. 203313</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;