import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState(() => {
        const saved = localStorage.getItem('ss-wishlist');
        return saved ? JSON.parse(saved) : [];
    });
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('ss-wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (product) => {
        setWishlist(prev => {
            const exists = prev.find(item => item._id === product._id);
            if (exists) {
                return prev.filter(item => item._id !== product._id);
            }
            return [...prev, product];
        });
    };

    const isInWishlist = (id) => wishlist.some(item => item._id === id);

    return (
        <WishlistContext.Provider value={{
            wishlist,
            isOpen: isWishlistOpen,
            setIsOpen: setIsWishlistOpen,
            toggleWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
