import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Verification from './Verification';
import HomePage from './HomePage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
//import AdminFooter from './admin/components/AdminFooter';
import AdminEmployees from './admin/AdminEmployees';
import AdminCustomers from './admin/AdminCustomers';
// Removed: import AdminRightPanel from './admin/components/AdminRightPanel';
import ResetPassword from './ResetPassword';
import RequestPasswordReset from './RequestPasswordReset';
import AdminProducts from './admin/AdminProducts';
import ProtectedRoute from './admin/ProtectedRoute';
import OrderDetails from './OrderDetails';
import OrderForm from './OrderForm';
import ToggleProductStatus from './ToggleProductStatus';
import AdminOrders from './admin/AdminOrders';
import AdminOrderDetails from './admin/AdminOrderDetails';
import About from './About';
import './App.css';
import SalesReport from './admin/SalesReport';
import SystemLogs from './admin/SystemLogs';
import AdminNotifications from './admin/AdminNotifications';

const App = () => {
  const isAdminHome =
    typeof window !== 'undefined' && window.location.pathname === '/adminhomepage';

  return (
    <Router>
      <div className={`App${isAdminHome ? ' AdminLayout' : ''}`}>
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
              </div>
            }
          />
          <Route
            path="/send-receipt"
            element={
              <div className="App">
                <Header />
                <div className="MainContent">
                  <Sidebar />
                  <div className="PageContent">
                    <SendReceipt />
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/send-receipt/:id"
            element={
              <div className="App">
                <Header />
                <div className="MainContent">
                  <Sidebar />
                  <div className="PageContent">
                    <SendReceipt />
                  </div>
                </div>
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
              </div>
            }
          />
          <Route
            path="/adminhomepage"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminHomePage />
                    </div>
                    {/* Removed <AdminRightPanel /> */}
                  </div>
                  {/* <AdminFooter /> if you want */}
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminemployees"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminEmployees />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminCustomers />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminProducts />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminOrders />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminOrderDetails />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-report"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <SalesReport />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-logs"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <SystemLogs />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <div className="App">
                  <AdminHeader />
                  <div className="MainContent">
                    <AdminSidebar />
                    <div className="PageContent">
                      <AdminNotifications />
                    </div>
                    {/* Removed AdminRightPanel here */}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/toggle"
            element={
              <div className="App">
                <Header />
                <div className="MainContent">
                  <Sidebar />
                  <div className="PageContent">
                    <ToggleProductStatus />
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/about"
            element={
              <div className="App">
                <Header />
                <div className="MainContent">
                  <Sidebar />
                  <div className="PageContent">
                    <About />
                  </div>
                </div>
              </div>
            }
          />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<RequestPasswordReset />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/order-form" element={<OrderForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
