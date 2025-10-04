import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './OrderForm.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

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
  const [attachedFile, setAttachedFile] = useState(null);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [orderId, setOrderId] = useState(null); // Store order ID for updates

  // Price calculation
  const [total, setTotal] = useState(0);

  // Cloudinary configuration - replace with your actual cloud name and upload preset
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload';
  const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';

  // Add this list for products that don't need height/width
  const noDimensionProducts = [
    'CANVAS CLOTH',
    'PP FILM MATTE',
    '58mm BUTTON PIN',
    'ACRYLIC RECTANGLE REF MAGNET 9.5x7 cm',
    'ACRYLIC RECTANGLE REF MAGNET 2.5x3.25 in',
    'BLOCK/LOT/HOUSE NO. PLATE',
    'TRUCK/CAR PLATE',
    'MOTORCYCLE PLATE',
    'ACRYLIC MEDAL',
    'ID LANYARD',
    'DTF PRINT PER 22x39 INCHES'
  ];

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
      if (!product) return;
      
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
  }, [product]);

  // Fetch customer info from localStorage and Supabase
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('email', userEmail)
            .single();
          
          if (!error && data) {
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setContact(data.phone_number || '');
            setAddress(data.address || '');
          }
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    };
    fetchCustomer();
  }, []);

  // Calculate price
  useEffect(() => {
    let price = 0;
    
    if (selectedVariant && quantity) {
      const basePrice = parseFloat(selectedVariant.retail_price || 0);
      const qtyInt = parseInt(quantity) || 1;
      
      if (noDimensionProducts.includes(product)) {
        // For products without dimensions, use base price * quantity
        price = basePrice * qtyInt;
      } else {
        // For products with dimensions, calculate based on area
        const heightFloat = parseFloat(height) || 0;
        const widthFloat = parseFloat(width) || 0;
        const area = heightFloat * widthFloat;
        price = basePrice * area * qtyInt;
      }
      
      // Add layout fee if no file
      if (!hasFile) {
        price += 150;
      }
      
      // Add eyelet fee for SOLVENT TARP
      if (product === 'SOLVENT TARP') {
        const eyeletsInt = parseInt(eyelets) || 0;
        if (eyeletsInt > 4) {
          price += (eyeletsInt - 4) * 10;
        }
      }
    } else if (productData && quantity) {
      // Fallback to product price if no variant selected
      const basePrice = parseFloat(productData.price || 0);
      const qtyInt = parseInt(quantity) || 1;
      
      if (noDimensionProducts.includes(product)) {
        price = basePrice * qtyInt;
      } else {
        const heightFloat = parseFloat(height) || 0;
        const widthFloat = parseFloat(width) || 0;
        const area = heightFloat * widthFloat;
        price = basePrice * area * qtyInt;
      }
      
      if (!hasFile) {
        price += 150;
      }
    }
    
    setTotal(Math.round(price * 100) / 100);
  }, [selectedVariant, quantity, width, height, hasFile, productData, product, eyelets]);

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'order_attachments'); // Optional: organize files in folders

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }

      const data = await response.json();
      return data.secure_url; // This is the Cloudinary URL
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const isFormValid = () => {
    if (!firstName || !lastName || !contact || !address || !quantity || !pickupDate || !pickupTime) {
      return false;
    }
    
    if (!noDimensionProducts.includes(product) && (!height || !width)) {
      return false;
    }
    
    if (variants.length > 0 && !selectedVariant) {
      return false;
    }
    
    return true;
  };

  const handleCheckout = async () => {
    if (!isFormValid()) return;

    try {
      let userEmail = localStorage.getItem('userEmail');
      let cloudinaryUrl = null;

      // Upload file to Cloudinary if attached
      if (attachedFile) {
        try {
          cloudinaryUrl = await uploadToCloudinary(attachedFile);
        } catch (error) {
          alert('Error uploading file. Please try again.');
          return;
        }
      }
      
      // If not logged in, use temporary email for walk-in customers
      if (!userEmail) {
        userEmail = `walkin_${Date.now()}@temp.com`;
      }

      // For walk-in customers, check if customer already exists by phone number
      if (!localStorage.getItem('userEmail')) {
        const { data: existingCustomer, error: checkError } = await supabase
          .from('customers')
          .select('id')
          .eq('phone_number', contact)
          .single();

        if (checkError && !existingCustomer) {
          // Create new customer record for walk-in customer
          const { error: createError } = await supabase
            .from('customers')
            .insert([{
              username: `walkin_${Date.now()}`,
              first_name: firstName,
              last_name: lastName,
              phone_number: contact,
              address: address,
              email: userEmail,
              is_barred: false
            }]);

          if (createError) {
            console.error('Error creating customer:', createError);
          }
        }
      }

      // Get employee details for web orders
      const employeeEmail = localStorage.getItem('employeeEmail') || localStorage.getItem('userEmail') || 'walk_in_counter';
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
          // Fetch employee details from database if not in localStorage
          const { data: employee } = await supabase
            .from('customers') // or 'employees' table if you have one
            .select('first_name, last_name')
            .eq('email', employeeEmail)
            .single();
          
          if (employee) {
            employeeFirstName = employee.first_name || 'Employee';
            employeeLastName = employee.last_name || 'Name';
          }
        }
      }

      // Create order with data that matches your orders schema
      const orderData = {
        first_name: firstName,
        last_name: lastName,
        phone_number: contact,
        address: address,
        email: userEmail,
        has_file: hasFile,
        variant: selectedVariant ? (selectedVariant.description || selectedVariant.size || product) : product,
        height: noDimensionProducts.includes(product) ? null : parseFloat(height),
        width: noDimensionProducts.includes(product) ? null : parseFloat(width),
        quantity: parseInt(quantity),
        eyelets: product === 'SOLVENT TARP' ? parseInt(eyelets) : null,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        instructions: instructions || null,
        total: total,
        status: 'Validation',
        attached_file: cloudinaryUrl,
        created_at: new Date().toISOString(),
        employee_email: employeeEmail,
        employee_first_name: employeeFirstName,
        employee_last_name: employeeLastName,
        // NEW: set order source so sales rows inherit it
        order_source: localStorage.getItem('userEmail') ? 'web' : 'walk-in'
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

      console.log('Order created:', order);
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

  const pickDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.ai,.psd';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setAttachedFile(file);
      }
    };
    input.click();
  };

  const renderContent = () => {
    if (showPaymentSummary) {
      return (
        <div className="order-form-container">
          <div className="payment-summary-card">
            <h2>Payment Summary</h2>
            <div className="order-summary">
              <div className="summary-row">
                <span>Product:</span>
                <span>{product}</span>
              </div>
              <div className="summary-row">
                <span>Customer:</span>
                <span>{firstName} {lastName}</span>
              </div>
              <div className="summary-row">
                <span>Contact:</span>
                <span>{contact}</span>
              </div>
              <div className="summary-row">
                <span>Address:</span>
                <span>{address}</span>
              </div>
              <div className="summary-row">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              {!noDimensionProducts.includes(product) && (
                <div className="summary-row">
                  <span>Dimensions:</span>
                  <span>{height} x {width} ft</span>
                </div>
              )}
              {selectedVariant && (
                <div className="summary-row">
                  <span>Variant:</span>
                  <span>{selectedVariant.description || selectedVariant.size}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Pickup Date:</span>
                <span>{pickupDate} at {pickupTime}</span>
              </div>
              {!hasFile && (
                <div className="summary-row">
                  <span>Layout Fee:</span>
                  <span>₱150</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total:</span>
                <span>₱{total}</span>
              </div>
            </div>
            <div className="payment-buttons">
              <button className="back-btn" onClick={() => setShowPaymentSummary(false)}>
                Back to Edit
              </button>
              <button className="paid-btn" onClick={handlePaymentComplete}>
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="order-form-container">
        <div className="order-form-content">
          {/* Left Side - Product Display */}
          <div className="product-display">
            <img 
              src={productData?.image_url || '/images/default-product.jpg'} 
              alt={product}
              className="product-image"
            />
            <div className="product-info">
              <h2 className="product-title">{product}</h2>
              <p className="product-description">
                {productData?.category === 'Tarpaulin' && 
                  'High-quality, durable tarpaulin prints perfect for events, promotions, and advertisements. Available in various sizes with vibrant, weather-resistant colors—ideal for indoor or outdoor use.'
                }
              </p>
            </div>
          </div>

          {/* Right Side - Order Form */}
          <div className="order-form-section">
            <div className="form-header">
              <h3>Order Form</h3>
            </div>

            <div className="form-content">
              {/* Customer Details */}
              <div className="form-group">
                <h4>Customer Details</h4>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input half"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input half"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="form-input full"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input full"
                />
              </div>

              {/* Order Details */}
              <div className="form-group">
                <h4>Order Details 
                  <span className="note">NOTE: Additional fee for layout ₱150</span>
                </h4>
                
                <div className="radio-group">
                  <span className="radio-label">Already have file?</span>
                  <div className="radio-options">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="hasFile"
                        checked={hasFile === true}
                        onChange={() => setHasFile(true)}
                      />
                      <span>YES</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="hasFile"
                        checked={hasFile === false}
                        onChange={() => setHasFile(false)}
                      />
                      <span>NO</span>
                    </label>
                  </div>
                </div>

                <div className="file-upload">
                  <button className="attach-btn" onClick={pickDocument}>
                    {attachedFile ? attachedFile.name : 'Attach file'}
                  </button>
                  {attachedFile && (
                    <button className="remove-file" onClick={() => setAttachedFile(null)}>
                      ×
                    </button>
                  )}
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="variants-section">
                    <h5>Choose Variant</h5>
                    {variants.map((variant, idx) => (
                      <label key={idx} className="variant-option">
                        <input
                          type="radio"
                          name="variant"
                          checked={selectedVariant === variant}
                          onChange={() => setSelectedVariant(variant)}
                        />
                        <span>
                          {variant.description || variant.size || 'Variant'} - Retail: ₱{variant.retail_price}
                          {variant.wholesale_price ? ` / Wholesale: ₱${variant.wholesale_price}` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Size and Quantity */}
                <div className="form-row">
                  {!noDimensionProducts.includes(product) && (
                    <>
                      <input
                        type="number"
                        placeholder="Height (ft)"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="form-input third"
                      />
                      <input
                        type="number"
                        placeholder="Width (ft)"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="form-input third"
                      />
                    </>
                  )}
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="form-input third"
                  />
                </div>

                {/* Eyelets for SOLVENT TARP */}
                {product === 'SOLVENT TARP' && (
                  <input
                    type="number"
                    placeholder="Eyelets"
                    value={eyelets}
                    onChange={(e) => setEyelets(e.target.value)}
                    className="form-input third"
                  />
                )}

                {/* Date to Pickup */}
                <div className="form-row">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="form-input half"
                  />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="form-input half"
                  />
                </div>

                {/* Instructions */}
                <textarea
                  placeholder="Instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              {/* Order Summary */}
              <div className="order-summary-box">
                <div className="summary-total">
                  <span>Total: ₱{total}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button 
                className={`place-order-btn ${!isFormValid() ? 'disabled' : ''}`}
                onClick={handleCheckout}
                disabled={!isFormValid()}
              >
                Place Order
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
