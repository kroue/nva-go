import React from 'react';
import './About.css';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';

export default function About() {
  return (
    <div className="About-page">
      <div className="About-header">
        <div className="About-header-content">
          <InfoOutlinedIcon className="About-header-icon" />
          <div className="About-header-text">
            <h1>About NVAGo</h1>
            <p>Learn more about our system and team</p>
          </div>
        </div>
      </div>

      <div className="About-container">
        {/* Overview Section */}
        <div className="About-card">
          <div className="card-header">
            <BusinessOutlinedIcon className="card-icon" />
            <h2>System Overview</h2>
          </div>
          <div className="card-content">
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
          </div>
        </div>

        {/* Features Section */}
        <div className="About-card">
          <div className="card-header">
            <StarOutlineOutlinedIcon className="card-icon" />
            <h2>Key Features</h2>
          </div>
          <div className="card-content">
            <div className="features-grid">
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>Online Ordering</h4>
                  <p>Place orders anytime, anywhere with our easy-to-use platform</p>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>Real-time Communication</h4>
                  <p>Chat directly with designers and track order progress</p>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>Secure Payments</h4>
                  <p>Support for GCash and other cashless payment methods</p>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>BOPIS Functionality</h4>
                  <p>Buy online and pickup in-store at your convenience</p>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>Admin Dashboard</h4>
                  <p>Manage orders, payments, and schedules efficiently</p>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlineOutlinedIcon className="feature-icon" />
                <div>
                  <h4>Order Tracking</h4>
                  <p>Real-time updates on order status and processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="About-grid">
          {/* Team Section */}
          <div className="About-card">
            <div className="card-header">
              <PeopleOutlineOutlinedIcon className="card-icon" />
              <h2>Project Team</h2>
            </div>
            <div className="card-content">
              <div className="team-list">
                <div className="team-member">
                  <div className="member-avatar">
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 24 }} />
                  </div>
                  <span>Kriz Marie P. Cultura</span>
                </div>
                <div className="team-member">
                  <div className="member-avatar">
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 24 }} />
                  </div>
                  <span>Ariana Marie Orrf. Palle</span>
                </div>
                <div className="team-member">
                  <div className="member-avatar">
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 24 }} />
                  </div>
                  <span>Aljohn B. Arranguez</span>
                </div>
                <div className="team-member">
                  <div className="member-avatar">
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 24 }} />
                  </div>
                  <span>Rodel T. Madrid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="About-card">
            <div className="card-header">
              <EmailOutlinedIcon className="card-icon" />
              <h2>Contact Information</h2>
            </div>
            <div className="card-content">
              <p className="contact-intro">
                For assistance, maintenance, or to report errors related to the NVAGo system, please contact:
              </p>
              <div className="contact-card">
                <div className="contact-header">
                  <div className="contact-avatar">
                    <PeopleOutlineOutlinedIcon style={{ fontSize: 28 }} />
                  </div>
                  <div>
                    <h3>Aljohn B. Arranguez</h3>
                    <span className="contact-role">System Administrator</span>
                  </div>
                </div>
                <div className="contact-details">
                  <div className="contact-item">
                    <EmailOutlinedIcon className="contact-icon" />
                    <div>
                      <span className="contact-label">Email</span>
                      <a href="mailto:arranguez.aljohn0130@gmail.com" className="contact-link">
                        arranguez.aljohn0130@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <PhoneOutlinedIcon className="contact-icon" />
                    <div>
                      <span className="contact-label">Mobile</span>
                      <a href="tel:+639535383369" className="contact-link">
                        +63 953 538 3369
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
