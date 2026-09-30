import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartSummary, setCartSummary] = useState({
    items: [],
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    totalPayable: 0,
    couponApplied: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async (couponCode = null) => {
    if (!isAuthenticated) {
      setCartSummary({
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        totalPayable: 0,
        couponApplied: null,
      });
      return;
    }

    setLoading(true);
    try {
      const url = couponCode ? `/cart?couponCode=${couponCode}` : '/cart';
      const res = await API.get(url);
      setCartSummary(res.data.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return false;
    }

    try {
      const res = await API.post('/cart/items', { productId, quantity });
      setCartSummary(res.data.data);
      toast.success(res.data.message || 'Added to cart!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart';
      toast.error(msg);
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await API.put(`/cart/items/${productId}`, { quantity });
      setCartSummary(res.data.data);
      toast.success('Cart updated');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      toast.error(msg);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await API.delete(`/cart/items/${productId}`);
      setCartSummary(res.data.data);
      toast.success('Item removed from cart');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      toast.error(msg);
    }
  };

  const clearCart = async () => {
    try {
      await API.delete('/cart');
      setCartSummary({
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        totalPayable: 0,
        couponApplied: null,
      });
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const itemCount = cartSummary.items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartSummary,
        itemCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
