import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './OrderForm.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';

// === helpers to build a sale from an order ===
const toNumber = (v, d = 0) => {
  if (v === null || v === undefined) return d;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  try {
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : d;
  } catch {
    return d;
  }
};
const isFalseyBool = (val) => {
  if (typeof val === 'boolean') return val === false;
  const s = String(val).trim().toLowerCase();
  return s === 'false' || s === '0' || s === 'no';
};
const getMonthText = (date = new Date()) =>
  date.toLocaleString('en-US', { month: 'long' });

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minutes} ${ampm}`;
};

const buildSaleFromOrderRow = (o) => {
  const qty = Math.max(1, toNumber(o.quantity, 1));
  const total = toNumber(o.total ?? o.total_amount ?? o.total_price, 0);

  // Business rule: add layout fee when customer has no file
  const layoutFee = isFalseyBool(o.has_file) ? 150 : 0;

  const subtotalRaw = total - layoutFee;
  const subtotal = subtotalRaw > 0 ? Number(subtotalRaw.toFixed(2)) : 0;
  const unit_price = qty > 0 ? Number((subtotal / qty).toFixed(2)) : 0;

  const width = toNumber(o.width, 0);
  const height = toNumber(o.height, 0);
  const variantDims = (width > 0 || height > 0) ? `${width}x${height} ft` : null;

  const saleDate = new Date();

  return {
    order_id: o.id,
    customer_email: o.email ?? 'unknown@local',
    customer_name: [o.first_name, o.last_name].filter(Boolean).join(' ') || 'Customer',
    product_name: o.variant || o.product_name || 'Order',
    variant: variantDims,
    quantity: qty,
    unit_price,
    subtotal,
    layout_fee: layoutFee,
    total_amount: Number(total.toFixed(2)),
    sale_date: saleDate.toISOString(),
    sale_month: getMonthText(saleDate),
    sale_year: saleDate.getFullYear(),
    employee_email: o.employee_email ?? null,
    employee_name: [o.employee_first_name, o.employee_last_name].filter(Boolean).join(' ') || null,
    order_source: o.order_source || (o.email?.includes('walkin_') ? 'walk-in' : 'web'),
    status: 'completed'
  };
};

const OrderForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const product = searchParams.get('product');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [hasFile, setHasFile] = useState(true);
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [eyelets, setEyelets] = useState('4');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productData, setProductData] = useState(null);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [orderId, setOrderId] = useState(null); // Store order ID for updates

  // For Other Products
  const [customProductName, setCustomProductName] = useState('');
  const [customVariant, setCustomVariant] = useState('');
  const [customVariantPrice, setCustomVariantPrice] = useState('');

  // Price calculation
  const [total, setTotal] = useState(0);

  // NEW: validation/warnings
  const [dtfWarning, setDtfWarning] = useState('');
  const [dimError, setDimError] = useState('');

  // Helper to normalize names for robust matching
  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Product identity + flags (use URL product or fetched productData)
  const productNameRaw = product || (productData?.name || '');
  const normalizedProduct = normalize(productNameRaw);
  const isDTFPrint = normalizedProduct.includes('dtf') && normalizedProduct.includes('print');
  const isSolventTarp = normalizedProduct.includes('solvent') && normalizedProduct.includes('tarp');
  const isSintra = normalizedProduct.includes('sintra'); // matches 'sintraboard' or 'sintra board'
  const isOtherProducts = normalizedProduct.includes('other products');
  const isDimProduct = isSintra || isSolventTarp; // Only these require dimensions per spec

  // Set pickup date/time on mount
  useEffect(() => {
    const now = new Date();
    const pickupDateStr = now.toISOString().split('T')[0];
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const pickupTimeStr = oneHourLater.toTimeString().slice(0, 5);
    setPickupDate(pickupDateStr);
    setPickupTime(pickupTimeStr);
  }, []);

  // Fetch product and variants from Supabase
  useEffect(() => {
    const fetchProductAndVariants = async () => {
      if (!product || isOtherProducts) return;

      try {
        // Fetch product data
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('name', product)
          .single();

        if (productError) {
          console.error('Error fetching product:', productError);
          return;
        }

        setProductData(productData);

        // Fetch variants
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productData.product_id);

        if (!variantsError && variantsData) {
          setVariants(variantsData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchProductAndVariants();
  }, [product, isOtherProducts]);

  // Walk-in flow: no customer lookup
  useEffect(() => {
    // Intentionally left blank. This form is for employee-created walk-in orders.
  }, []);

  // DTF minimum quantity validation
  useEffect(() => {
    const qty = parseInt(quantity) || 0;
    if (isDTFPrint && qty > 0 && qty < 10) {
      setDtfWarning('Minimum quantity for DTF Print is 10.');
    } else {
      setDtfWarning('');
    }
  }, [isDTFPrint, quantity]);

  // Calculate price with rules
  useEffect(() => {
    let price = 0;

    if (isOtherProducts) {
      const customPrice = parseFloat(customVariantPrice) || 0;
      const qtyInt = parseInt(quantity) || 1;
      price = customPrice * qtyInt;
      if (!hasFile) {
        price += 150;
      }
    } else if (selectedVariant && quantity) {
      const basePrice = parseFloat(selectedVariant.retail_price || 0);
      const qtyInt = parseInt(quantity) || 1;

      if (isDimProduct) {
        const heightFloat = parseFloat(height) || 0;
        const widthFloat = parseFloat(width) || 0;
        const area = Math.max(1, heightFloat * widthFloat);
        price = basePrice * area * qtyInt;
      } else {
        price = basePrice * qtyInt;
      }

      if (!hasFile) {
        price += 150;
      }

      if (isSolventTarp) {
        const eyeletsInt = parseInt(eyelets) || 0;
        price += eyeletsInt * 4 * qtyInt;
      }
    } else if (productData && quantity) {
      const basePrice = parseFloat(productData.price || 0);
      const qtyInt = parseInt(quantity) || 1;

      if (isDimProduct) {
        const heightFloat = parseFloat(height) || 0;
        const widthFloat = parseFloat(width) || 0;
        const area = Math.max(1, heightFloat * widthFloat);
        price = basePrice * area * qtyInt;
      } else {
        price = basePrice * qtyInt;
      }

      if (!hasFile) {
        price += 150;
      }

      if (isSolventTarp) {
        const eyeletsInt = parseInt(eyelets) || 0;
        price += eyeletsInt * 4 * qtyInt;
      }
    }

    setTotal(Math.round(price * 100) / 100);
  }, [selectedVariant, quantity, width, height, hasFile, productData, eyelets, isDimProduct, isSolventTarp, isOtherProducts, customVariantPrice]);

  const isFormValid = () => {
    if (!firstName || !lastName || !contact || !address || !quantity || !pickupDate || !pickupTime) {
      return false;
    }
    if (isDTFPrint && (parseInt(quantity) || 0) < 10) return false;
    if (isDimProduct) {
      if (!height || !width) return false;
      const h = parseFloat(height);
      const w = parseFloat(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) return false;
      const small = Math.min(h, w);
      const large = Math.max(h, w);
      if (small < 2 || large < 3) return false;
    }
    if (isOtherProducts) {
      if (!customProductName || !customVariant || !customVariantPrice) return false;
    } else {
      if (variants.length > 0 && !selectedVariant) {
        return false;
      }
    }
    if (isSolventTarp) {
      const e = parseInt(eyelets);
      if (isNaN(e) || e < 0) return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!isFormValid()) return;

    try {
      // No attachment/upload flow
      const cloudinaryUrl = null;

      // Get employee details for walk-in orders (employee is logged in to admin)
      const employeeEmail =
        localStorage.getItem('employeeEmail') ||
        localStorage.getItem('userEmail') ||
        'walk_in_counter';
      let employeeFirstName = 'Walk-in';
      let employeeLastName = 'Counter';

      // Try to get employee name from localStorage or fetch from database
      if (localStorage.getItem('userEmail')) {
        const storedFirstName = localStorage.getItem('employeeFirstName');
        const storedLastName = localStorage.getItem('employeeLastName');

        if (storedFirstName && storedLastName) {
          employeeFirstName = storedFirstName;
          employeeLastName = storedLastName;
        } else {
          const { data: employee } = await supabase
            .from('customers') // or 'employees' table if available
            .select('first_name, last_name')
            .eq('email', employeeEmail)
            .single();

          if (employee) {
            employeeFirstName = employee.first_name || 'Employee';
            employeeLastName = employee.last_name || 'Name';
          }
        }
      }

      const orderData = {
        first_name: firstName,
        last_name: lastName,
        phone_number: contact,
        address: address,
        email: null, // No customer account for walk-ins
        has_file: hasFile,
        product_name: isOtherProducts ? customProductName : (productData?.name || product),
        variant: isOtherProducts ? customVariant : (selectedVariant ? (selectedVariant.description || selectedVariant.size || product) : product),
        height: isDimProduct ? (height ? parseFloat(height) : null) : null,
        width: isDimProduct ? (width ? parseFloat(width) : null) : null,
        quantity: parseInt(quantity),
        eyelets: isSolventTarp ? (parseInt(eyelets) || 0) : null,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        instructions: instructions || null,
        total: total,
        status: 'Validation',
        attached_file: cloudinaryUrl, // always null (no attach)
        created_at: new Date().toISOString(),
        employee_email: employeeEmail,
        employee_first_name: employeeFirstName,
        employee_last_name: employeeLastName,
        order_source: 'walk-in'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        alert('Error creating order: ' + orderError.message);
        return;
      }

      setOrderId(order.id);
      setShowPaymentSummary(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing order');
    }
  };

  const handlePaymentComplete = async () => {
    try {
      if (!orderId) {
        alert('Order ID not found');
        return;
      }

      // 1) Mark order as paid (and keep consistency with ValidatePayment page)
      const { error: updErr } = await supabase
        .from('orders')
        .update({
          status: 'Layout Approval',
          payment_proof: 'walk_in_payment'
        })
        .eq('id', orderId);

      if (updErr) {
        console.error('Error updating order:', updErr);
        alert('Error updating order status: ' + updErr.message);
        return;
      }

      // 2) Fetch the fresh order row to build the sale payload
      const { data: orderRow, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchErr || !orderRow) {
        console.error('Error fetching order for sale:', fetchErr);
        alert('Error fetching order for sale: ' + (fetchErr?.message || 'Unknown error'));
        return;
      }

      // 3) Skip if a sale already exists for this order
      const { data: existing, error: existErr } = await supabase
        .from('sales')
        .select('id')
        .eq('order_id', orderId)
        .limit(1);

      if (existErr) {
        console.error('Error checking existing sale:', existErr);
        alert('Error checking existing sale: ' + existErr.message);
        return;
      }

      if (!existing || existing.length === 0) {
        const saleRow = buildSaleFromOrderRow(orderRow);
        const { error: saleErr } = await supabase.from('sales').insert([saleRow]);
        if (saleErr) {
          console.error('Error inserting sale:', saleErr, 'Payload:', saleRow);
          alert('Error recording sale: ' + saleErr.message);
          // continue navigation anyway
        }
      }

      alert('Payment confirmed! Recorded as sale and sent for layout approval.');
      if (!localStorage.getItem('userEmail')) {
        navigate('/products');
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing payment confirmation');
    }
  };

  const renderContent = () => {
    if (showPaymentSummary) {
      return (
        <div className="OrderForm-page">
          <div className="OrderForm-header">
            <div className="OrderForm-header-content">
              <ShoppingCartOutlined className="OrderForm-header-icon" />
              <div className="OrderForm-header-text">
                <h1>Payment Summary</h1>
                <p>Review order details and confirm payment</p>
              </div>
            </div>
          </div>

          <div className="OrderForm-container">
            <div className="payment-summary-card">
              <div className="summary-section">
                <h3>
                  <InventoryOutlinedIcon style={{ fontSize: 20, marginRight: 8 }} />
                  Order Details
                </h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Product</span>
                    <span className="summary-value">{isOtherProducts ? customProductName : product}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Customer</span>
                    <span className="summary-value">{firstName} {lastName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Contact</span>
                    <span className="summary-value">{contact}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Address</span>
                    <span className="summary-value">{address}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Quantity</span>
                    <span className="summary-value">{quantity} pcs</span>
                  </div>
                  {isDimProduct && (
                    <div className="summary-item">
                      <span className="summary-label">Dimensions</span>
                      <span className="summary-value">{height} × {width} ft</span>
                    </div>
                  )}
                  {isSolventTarp && (
                    <div className="summary-item">
                      <span className="summary-label">Eyelets</span>
                      <span className="summary-value">{eyelets}</span>
                    </div>
                  )}
                  {isOtherProducts && (
                    <div className="summary-item">
                      <span className="summary-label">Variant</span>
                      <span className="summary-value">{customVariant} - ₱{customVariantPrice}</span>
                    </div>
                  )}
                  {selectedVariant && !isOtherProducts && (
                    <div className="summary-item">
                      <span className="summary-label">Variant</span>
                      <span className="summary-value">{selectedVariant.description || selectedVariant.size}</span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="summary-label">Pickup Date</span>
                    <span className="summary-value">{pickupDate} at {formatTime12Hour(pickupTime)}</span>
                  </div>
                </div>
              </div>

              <div className="payment-breakdown">
                <h3>
                  <AttachMoneyOutlinedIcon style={{ fontSize: 20, marginRight: 8 }} />
                  Payment Breakdown
                </h3>
                {!hasFile && (
                  <div className="breakdown-row">
                    <span>Layout Fee</span>
                    <span>₱150</span>
                  </div>
                )}
                <div className="breakdown-row total-row">
                  <strong>Total Amount</strong>
                  <strong>₱{total}</strong>
                </div>
              </div>

              <div className="payment-actions">
                <button className="action-btn secondary" onClick={() => setShowPaymentSummary(false)}>
                  Back to Edit
                </button>
                <button className="action-btn primary" onClick={handlePaymentComplete}>
                  <CheckCircleOutlineOutlinedIcon style={{ fontSize: 18 }} />
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="OrderForm-page">
        <div className="OrderForm-header">
          <div className="OrderForm-header-content">
            <ShoppingCartOutlined className="OrderForm-header-icon" />
            <div className="OrderForm-header-text">
              <h1>{isOtherProducts ? 'Custom Order' : product}</h1>
              <p>Create a new walk-in order</p>
            </div>
          </div>
          <div className="OrderForm-price-badge">
            <span className="price-label">Total</span>
            <span className="price-value">₱{total}</span>
          </div>
        </div>

        <div className="OrderForm-container">
          <div className="OrderForm-layout">
            {/* Left Column - Product Info */}
            <div className="OrderForm-product-section">
              <div className="product-image-card">
                <img
                  src={productData?.image_url || '/images/default-product.jpg'}
                  alt={product}
                  className="product-image"
                />
              </div>
              <div className="product-info-card">
                <h2>{isOtherProducts ? 'Other Products' : product}</h2>
                <p className="product-description">
                  {productData?.category === 'Tarpaulin' &&
                    'High-quality, durable tarpaulin prints perfect for events, promotions, and advertisements. Available in various sizes with vibrant, weather-resistant colors—ideal for indoor or outdoor use.'
                  }
                  {isOtherProducts && 'Custom order for products not listed in our catalog.'}
                </p>
              </div>
            </div>

            {/* Right Column - Order Form */}
            <div className="OrderForm-form-section">
              {/* Customer Details */}
              <div className="form-card">
                <div className="form-card-header">
                  <PersonOutlineOutlinedIcon className="card-icon" />
                  <h3>Customer Details</h3>
                </div>
                <div className="form-card-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label>First Name</label>
                      <input
                        type="text"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Last Name</label>
                      <input
                        type="text"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>
                      <PhoneOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                      Contact Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>
                      <LocationOnOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="form-card">
                <div className="form-card-header">
                  <InventoryOutlinedIcon className="card-icon" />
                  <h3>Order Details</h3>
                  <span className="layout-fee-note">Layout fee: ₱150 (if no file)</span>
                </div>
                <div className="form-card-content">
                  <div className="radio-group">
                    <span className="radio-label">Already have file?</span>
                    <div className="radio-options">
                      <label className={`radio-btn ${hasFile === true ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="hasFile"
                          checked={hasFile === true}
                          onChange={() => setHasFile(true)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className={`radio-btn ${hasFile === false ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="hasFile"
                          checked={hasFile === false}
                          onChange={() => setHasFile(false)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {/* Custom Product Details */}
                  {isOtherProducts && (
                    <div className="custom-product-fields">
                      <div className="form-field">
                        <label>Product Name</label>
                        <input
                          type="text"
                          placeholder="Enter product name"
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-field">
                          <label>Variant</label>
                          <input
                            type="text"
                            placeholder="Enter variant"
                            value={customVariant}
                            onChange={(e) => setCustomVariant(e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label>Price per unit</label>
                          <input
                            type="number"
                            placeholder="Enter price"
                            value={customVariantPrice}
                            onChange={(e) => setCustomVariantPrice(e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variants */}
                  {!isOtherProducts && variants.length > 0 && (
                    <div className="variants-grid">
                      {variants.map((variant, idx) => (
                        <label key={idx} className={`variant-card ${selectedVariant === variant ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariant === variant}
                            onChange={() => setSelectedVariant(variant)}
                            style={{ display: 'none' }}
                          />
                          <div className="variant-content">
                            <span className="variant-name">{variant.description || variant.size || 'Variant'}</span>
                            <span className="variant-price">₱{variant.retail_price}</span>
                          </div>
                          {selectedVariant === variant && (
                            <CheckCircleOutlineOutlinedIcon className="variant-check" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Dimensions and Quantity */}
                  <div className="form-row">
                    {isDimProduct && (
                      <>
                        <div className="form-field">
                          <label>
                            <AspectRatioOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                            Height (ft)
                          </label>
                          <input
                            type="number"
                            placeholder="Height"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label>Width (ft)</label>
                          <input
                            type="number"
                            placeholder="Width"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-field">
                      <label>Quantity</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Eyelets */}
                  {isSolventTarp && (
                    <div className="form-field">
                      <label>Eyelets</label>
                      <input
                        type="number"
                        placeholder="Number of eyelets"
                        value={eyelets}
                        onChange={(e) => setEyelets(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  )}

                  {/* Validation messages */}
                  {!!dtfWarning && (
                    <div className="warning-message">
                      {dtfWarning}
                    </div>
                  )}
                  {isDimProduct && (
                    <div className="info-message">
                      Minimum size: 2 × 3 ft (either 2×3 or 3×2)
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Details */}
              <div className="form-card">
                <div className="form-card-header">
                  <CalendarTodayOutlinedIcon className="card-icon" />
                  <h3>Pickup Details</h3>
                </div>
                <div className="form-card-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label>
                        <CalendarTodayOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                        Pickup Date
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>
                        <AccessTimeOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>
                      <DescriptionOutlinedIcon style={{ fontSize: 16, marginRight: 4 }} />
                      Special Instructions
                    </label>
                    <textarea
                      placeholder="Enter any special instructions..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                className={`place-order-btn ${!isFormValid() ? 'disabled' : ''}`}
                onClick={handleCheckout}
                disabled={!isFormValid()}
              >
                <ShoppingCartOutlined style={{ fontSize: 20 }} />
                Place Order - ₱{total}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        {renderContent()}
      </div>
    </div>
  );
};

export default OrderForm;
