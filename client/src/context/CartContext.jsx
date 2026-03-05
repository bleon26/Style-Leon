import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('ss-cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('ss-cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, qty = 1, color = null, size = null) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => item._id === product._id && item.color === color && item.size === size
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].qty += qty;
                return newCart;
            }

            return [...prevCart, { ...product, qty, color, size }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id, color, size) => {
        setCart(prevCart => prevCart.filter(
            item => !(item._id === id && item.color === color && item.size === size)
        ));
    };

    const updateQty = (id, color, size, newQty) => {
        if (newQty < 1) return;
        setCart(prevCart => prevCart.map(item =>
            (item._id === id && item.color === color && item.size === size)
                ? { ...item, qty: newQty }
                : item
        ));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const cartCount = cart.reduce((total, item) => total + item.qty, 0);

    return (
        <CartContext.Provider value={{
            cart,
            isOpen: isCartOpen,
            setIsOpen: setIsCartOpen,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
