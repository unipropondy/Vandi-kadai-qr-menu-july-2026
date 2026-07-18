import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { registerCustomer } from '../services/api';
import { User, Phone, Mail, Tag, Award, MapPin } from 'lucide-react';
import './RegisterForm.css';

const RegisterForm = () => {
  const [branchId, setBranchId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countryCode, setCountryCode] = useState('+65');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      promoCode: ''
    }
  });

  // Extract URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branch = params.get('branchId') || '';
    const camp = params.get('campaign') || '';
    setBranchId(branch);
    setCampaign(camp);
  }, []);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const onSubmit = async (data) => {
    const payload = {
      name: data.name.trim(),
      mobile: `${countryCode}${data.mobile.trim()}`,
      email: data.email.trim() || '',
      promoCode: data.promoCode.trim() || '',
      address: data.address ? data.address.trim() : '',
      branchId: branchId,
      campaign: campaign,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    };

    setIsAnimating(true);
    const apiPromise = registerCustomer(payload);
    const animationDelay = delay(3700); // Wait 3.7s for success to slide in (animation accelerated to 5s total)

    try {
      const [response] = await Promise.all([apiPromise, animationDelay]);
      
      if (response && response.success) {
        // Wait another 0.8 seconds for the checkmark draw animation to finish
        await delay(800);

        await Swal.fire({
          title: 'Thank You!',
          html: 'Your registration has been completed successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffd700', // Brand gold color
          allowOutsideClick: false,
          customClass: {
            popup: 'premium-swal-popup',
            title: 'premium-swal-title',
            confirmButton: 'premium-swal-button'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            setIsCompleted(true);
            
            // Try closing standard tabs
            window.open('', '_self', '');
            window.close();
          }
        });
        reset(); // Reset form fields on success
      } else {
        throw new Error(response.message || 'Registration response was unsuccessful.');
      }
    } catch (error) {
      Swal.fire({
        title: 'Registration Failed',
        text: error.message || 'Something went wrong. Please try again.',
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Retry',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ffd700',
        customClass: {
          popup: 'premium-swal-popup',
          title: 'premium-swal-title',
          confirmButton: 'premium-swal-button'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Re-trigger submit with current form data
          handleSubmit(onSubmit)();
        }
      });
    } finally {
      setIsAnimating(false);
    }
  };

  const isFormDisabled = isSubmitting || isAnimating;

  if (isCompleted) {
    return (
      <div className="form-card success-screen" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="success-icon-wrapper" style={{ margin: '0 auto 24px auto', position: 'relative', width: '80px', height: '80px' }}>
          <div className="success-icon-glow" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, rgba(212, 175, 55, 0) 70%)', filter: 'blur(5px)' }}></div>
          <svg className="success-checkmark" viewBox="0 0 52 52" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'block', strokeWidth: 3, stroke: '#d4af37', strokeMiterlimit: 10, boxShadow: 'inset 0px 0px 0px #d4af37' }}>
            <circle cx="26" cy="26" r="25" fill="none" stroke="#d4af37" strokeWidth="3" />
            <path fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 className="brand-welcome-title" style={{ fontSize: '28px', margin: '0 0 12px 0' }}>You're All Set!</h2>
        <p className="brand-subtitle" style={{ fontSize: '15px', color: '#cccccc', margin: '0 0 30px 0', lineHeight: '1.6' }}>
          Your registration is complete.<br />You can safely close this browser window.
        </p>
        <button 
          type="button"
          className="close-window-btn" 
          onClick={() => {
            window.open('', '_self', '');
            window.close();
          }}
        >
          Close This Page
        </button>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="card-header">
        <h2 className="brand-welcome-title">Welcome!</h2>
        <p className="brand-subtitle">Please register to receive offers and rewards.</p>
      </div>

      {(branchId || campaign) && (
        <div className="badge-container">
          {branchId && (
            <span className="info-badge">
              <Award size={12} /> Branch: {branchId}
            </span>
          )}
          {campaign && (
            <span className="info-badge">
              <Tag size={12} /> Campaign: {campaign}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="registration-form" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="name">Full Name <span className="required">*</span></label>
          <div className="input-wrapper">
            <User className="input-icon" size={18} />
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              disabled={isFormDisabled}
              className={errors.name ? 'input-error' : ''}
              {...register('name', {
                required: 'Full name is required',
                validate: (value) => value.trim().length > 0 || 'Name cannot be empty'
              })}
            />
          </div>
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        {/* Mobile Number */}
        <div className="form-group">
          <label htmlFor="mobile">Mobile Number <span className="required">*</span></label>
          <div className="input-wrapper mobile-wrapper">
            <Phone className="input-icon" size={18} />
            <select
              className="country-select-hidden"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isFormDisabled}
            >
              <option value="+65">SG +65</option>
              <option value="+91">IND +91</option>
              <option value="+60">MY +60</option>
              <option value="+62">ID +62</option>
              <option value="+63">PH +63</option>
              <option value="+86">CN +86</option>
              <option value="+1">US +1</option>
              <option value="+44">UK +44</option>
              <option value="+61">AUS +61</option>
            </select>
            <div className="country-code-display">
              {countryCode} <span className="dropdown-arrow">▼</span>
            </div>
            <input
              id="mobile"
              type="tel"
              placeholder="Mobile number"
              disabled={isFormDisabled}
              className={errors.mobile ? 'input-error' : ''}
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                  (e.key >= '0' && e.key <= '9')
                ) {
                  return;
                }
                e.preventDefault();
              }}
              {...register('mobile', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9]{5,15}$/,
                  message: 'Please enter a valid mobile number'
                }
              })}
            />
          </div>
          {errors.mobile && <span className="error-message">{errors.mobile.message}</span>}
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="email">Email Address <span className="optional">(Optional)</span></label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              id="email"
              type="email"
              placeholder="yourname@example.com"
              disabled={isFormDisabled}
              className={errors.email ? 'input-error' : ''}
              {...register('email', {
                validate: (value) => {
                  if (!value) return true;
                  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                  return pattern.test(value) || 'Please enter a valid email address';
                }
              })}
            />
          </div>
          {errors.email && <span className="error-message">{errors.email.message}</span>}
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="address">Address <span className="optional">(Optional)</span></label>
          <div className="input-wrapper">
            <MapPin className="input-icon" size={18} />
            <input
              id="address"
              type="text"
              placeholder="Enter your address"
              disabled={isFormDisabled}
              className={errors.address ? 'input-error' : ''}
              {...register('address')}
            />
          </div>
          {errors.address && <span className="error-message">{errors.address.message}</span>}
        </div>

        {/* Promo Code */}
        <div className="form-group">
          <label htmlFor="promoCode">Promo Code <span className="required">*</span></label>
          <div className="input-wrapper">
            <Tag className="input-icon" size={18} />
            <input
              id="promoCode"
              type="text"
              placeholder="e.g. PRO123"
              disabled={isFormDisabled}
              className={errors.promoCode ? 'input-error' : ''}
              {...register('promoCode', {
                required: 'Promo code is required',
                validate: (value) => value.trim().length > 0 || 'Promo code cannot be empty'
              })}
            />
          </div>
          {errors.promoCode && <span className="error-message">{errors.promoCode.message}</span>}
        </div>

        {/* Dynamic Truck Order Confirm Button */}
        <button
          type="submit"
          className={`submit-btn order ${isAnimating ? 'animate' : ''}`}
          disabled={isFormDisabled}
        >
          <span className="default">Register Now</span>
          <span className="success">
            Registered!
            <svg viewBox="0 0 12 10">
              <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
            </svg>
          </span>
          <div className="box"></div>
          <div className="truck">
            <div className="back"></div>
            <div className="front">
              <div className="window"></div>
            </div>
            <div className="light top"></div>
            <div className="light bottom"></div>
          </div>
          <div className="lines"></div>
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
