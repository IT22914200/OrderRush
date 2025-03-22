// Placeorder.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import { Button, TextField, Typography, Box, Container, Grid, Paper, CircularProgress } from '@mui/material';
import './Placeorder.css';

const Placeorder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    street: "",
    phone: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal > 0 ? 2 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    // Redirect if no token or empty cart
    if (!token || getTotalCartAmount() === 0) {
      navigate('/cart');
      return;
    }
    
    fetchUserData();
  }, [token, navigate, getTotalCartAmount]);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem("uid");
      const response = await axios.get(`${url}/api/user/${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          token 
        },
      });

      const { name, email, address, phoneNumber } = response.data.user;
      
      setFormData({
        firstName: name,
        email,
        street: address,
        phone: phoneNumber
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      const errorMessage = error.response?.data?.message || "Error fetching user data";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const orderItems = food_list
      .filter(item => cartItems[item._id] > 0)
      .map(item => ({
        ...item,
        quantity: cartItems[item._id]
      }));
    
    const orderData = {
      address: formData,
      items: orderItems,
      amount: total,
    };
    
    try {
      const response = await axios.post(
        `${url}/api/order/place`, 
        orderData, 
        { headers: { token } }
      );
      
      if (response.data.success) {
        window.location.replace(response.data.session_url);
      } else {
        throw new Error("Order placement failed");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography ml={2}>Loading user data...</Typography>
      </Box>
    );
  }

  return (
    <Container className="place-order-container">
      <Paper elevation={3} className="place-order-paper">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Left side - Delivery Information */}
            <Grid item xs={12} md={6}>
              <Box className="form-section">
                <Typography variant="h5" component="h2" gutterBottom className="section-title">
                  Delivery Information
                </Typography>
                
                <TextField
                  fullWidth
                  required
                  label="Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  required
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  required
                  label="Street address"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  required
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  inputProps={{
                    pattern: "[0-9]{10}",
                    title: "Phone number must be 10 digits"
                  }}
                />
              </Box>
            </Grid>
            
            {/* Right side - Order Summary */}
            <Grid item xs={12} md={6}>
              <Box className="order-summary">
                <Typography variant="h5" component="h2" gutterBottom className="section-title">
                  Order Summary
                </Typography>
                
              
                <Box className="summary-row">
  <Typography style={{ color: 'black' }}>Subtotal</Typography>
  <Typography className="summary-value" style={{ color: 'black' }}>
    ${subtotal.toFixed(2)}
  </Typography>
</Box>

<Box className="summary-row">
  <Typography style={{ color: 'black' }}>Delivery Fee</Typography>
  <Typography className="summary-value" style={{ color: 'black' }}>
    ${deliveryFee.toFixed(2)}
  </Typography>
</Box>


            
                
                <Box className="summary-row total">
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6">${total.toFixed(2)}</Typography>
                </Box>
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  className="payment-button"
                  disabled={total === 0}
                >
                  PROCEED TO PAYMENT
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Placeorder;
