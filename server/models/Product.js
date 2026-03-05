const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number },
    image: { type: String },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    isNewProduct: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
