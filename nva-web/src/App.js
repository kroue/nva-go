import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './Login';
import SignUp from './SignUp';
import HomePage from './HomePage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Orders from './Orders';
import ProcessOrders from './ProcessOrders';
import ValidatePayment from './ValidatePayment';
import SendReceipt from './SendReceipt';
import Products from './Products';
import Customers from './Customers'; // Add this import
import Notifications from './Notifications';
import Messages from './Messages';
import AdminLogin from './admin/AdminLogin';
import AdminHomePage from './admin/AdminPage';
import AdminHeader from './admin/components/AdminHeader';
import AdminSidebar from './admin/components/AdminSidebar';
import AdminFooter from './admin/components/AdminFooter';
import AdminEmployees from './admin/AdminEmployees';
import AdminCustomers from './admin/AdminCustomers';
import AdminRightPanel from './admin/components/AdminRightPanel';
import ResetPassword from './ResetPassword';
import RequestPasswordReset from './RequestPasswordReset';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/homepage"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <HomePage />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/orders"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <Orders />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/orders/process"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <ProcessOrders />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/orders/validate"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <ValidatePayment />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/orders/receipt"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <SendReceipt />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/products"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <Products />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/customers"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <Customers />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/notifications"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <Notifications />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/messages"
          element={
            <div className="App">
              <Header />
              <div className="MainContent">
                <Sidebar />
                <div className="PageContent">
                  <Messages />
                </div>
              </div>
              <Footer />
            </div>
          }
        />
        <Route
          path="/adminhomepage"
          element={
            <div className="App">
              <AdminHeader />
              <div className="MainContent">
                <AdminSidebar />
                <div className="PageContent">
                  <AdminHomePage />
                </div>
                <AdminRightPanel />
              </div>
              <AdminFooter />
            </div>
          }
        />
        <Route
          path="/adminemployees"
          element={
            <div className="App">
              <AdminHeader />
              <div className="MainContent">
                <AdminSidebar />
                <div className="PageContent">
                  <AdminEmployees />
                </div>
                <AdminRightPanel />
              </div>
            </div>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <div className="App">
              <AdminHeader />
              <div className="MainContent">
                <AdminSidebar />
                <div className="PageContent">
                  <AdminCustomers />
                </div>
                <AdminRightPanel />
              </div>
              <AdminFooter />
            </div>
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<RequestPasswordReset />} />
      </Routes>
    </Router>
  );
};

export default App;
