const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const products = [
    {
        name: "Vestido Maxi Floral",
        category: "mujer",
        price: 499,
        originalPrice: 850,
        discount: 41,
        image: "product_dress_floral_1772126709760.png",
        rating: 4.8,
        reviewsCount: 156,
        isNewProduct: true,
        isSale: true,
        colors: ["#ff6b9d", "#ffd700", "#7ecb20"],
        sizes: ["XS", "S", "M", "L", "XL"],
        description: "Vestido maxi floral de gasa ligera. Perfecto para ocasiones especiales."
    },
    {
        name: "Sneakers Chunky Blancos",
        category: "calzado",
        price: 699,
        originalPrice: 1100,
        discount: 36,
        image: "product_sneakers_1772126728593.png",
        rating: 4.7,
        reviewsCount: 235,
        isNewProduct: true,
        isSale: false,
        colors: ["#ffffff", "#000000", "#e74c3c"],
        sizes: ["36", "37", "38", "39", "40", "41", "42"],
        description: "Sneakers de plataforma chunky ultra trendy."
    },
    {
        name: "Camiseta Básica Blanca",
        category: "hombre",
        price: 149,
        originalPrice: 249,
        discount: 40,
        image: "product_hoodie_white_1772126662744.png",
        rating: 4.4,
        reviewsCount: 891,
        isNewProduct: false,
        isSale: false,
        colors: ["#ffffff", "#000000", "#7f8c8d", "#1a237e"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        description: "Camiseta básica 100% algodón. Corte recto con cuello redondo."
    },
    {
        name: "Falda Mini Plisada",
        category: "mujer",
        price: 289,
        originalPrice: 450,
        discount: 36,
        image: "product_dress_floral_1772126709760.png",
        rating: 4.5,
        reviewsCount: 203,
        isNewProduct: true,
        isSale: false,
        colors: ["#e91e8c", "#000000", "#3f51b5", "#4caf50"],
        sizes: ["XS", "S", "M", "L", "XL"],
        description: "Falda mini plisada con movimiento fluido."
    },
    {
        name: "Tenis Running Pro",
        category: "calzado",
        price: 899,
        originalPrice: 1299,
        discount: 31,
        image: "product_sneakers_1772126728593.png",
        rating: 4.8,
        reviewsCount: 445,
        isNewProduct: false,
        isSale: true,
        colors: ["#e74c3c", "#3498db", "#2ecc71", "#000000"],
        sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
        description: "Tenis de alto rendimiento para running."
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding');

        await Product.deleteMany({});
        console.log('🗑️ Deleted old products');

        await Product.insertMany(products);
        console.log('🌱 Data seeded successfully');

        process.exit();
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
};

seedDB();
