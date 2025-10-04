import React from 'react';
import './About.css';

export default function About() {
  return (
    <div className="About">
      <div className="About-header">About NVAGo</div>

      <div className="About-card">
        <p>
          NVAGo is an innovative online ordering and Point of Sale (POS) system designed specifically
          for NVA Printing Services. It modernizes traditional print shop operations by integrating
          convenient online ordering, real-time customer-designer communication, and secure cashless
          payment options such as GCash. Developed to address the challenges faced by
          physical-store-only ordering, NVAGo enables customers to place customized orders anytime
          and anywhere, upload design files, chat directly with graphic designers, and track their
          orders in real time.
        </p>
        <p>
          This system not only improves customer convenience by supporting Buy-Online-Pickup-In-Store
          (BOPIS) functionality but also streamlines business operations through a web-based admin
          dashboard for managing orders, payments, and schedules. By enhancing communication and
          reducing manual errors, NVAGo helps NVA Printing Services deliver faster, more
          transparent, and user-friendly service, empowering the business to thrive in the digital era.
        </p>

        <h3 className="About-sectionTitle">Project Members</h3>
        <ul className="About-list">
          <li>Kriz Marie P. Cultura</li>
          <li>Ariana Marie Orrf. Palle</li>
          <li>Aljohn B. Arranguez</li>
          <li>Rodel T. Madrid</li>
        </ul>

        <h3 className="About-sectionTitle">Contact Information</h3>
        <p>
          For assistance, maintenance, or to report errors related to the NVAGo system, please contact:
        </p>
        <div className="About-contact">
          <div className="About-contactName">Aljohn B. Arranguez</div>
          <div>Email: <a className="About-link" href="mailto:arranguez.aljohn0130@gmail.com">arranguez.aljohn0130@gmail.com</a></div>
          <div>Mobile: +639535383369</div>
        </div>
      </div>
    </div>
  );
}