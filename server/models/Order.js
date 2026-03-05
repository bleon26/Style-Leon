const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerTown: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    customerReference: { type: String, default: '' },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [
        {
            _id: String,
            name: String,
            price: Number,
            qty: Number,
            image: String,
            color: String,
            size: String
        }
    ],
    shippingAddress: {
        address: String,
        city: String,
        state: String,
        zip: String
    },
    phone: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        default: 'Tarjeta'
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    status: {
        type: String,
        required: true,
        default: 'Preparando' // Preparando, Enviado, En Camino, Entregado, Cancelado
    },
    deliveryRange: {
        start: Date,
        end: Date
    },
    deliveredAt: {
        type: Date
    },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, default: '' },
        reviewedAt: { type: Date }
    },
    isPaid: {
        type: Boolean,
        default: true
    },
    paidAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-generate orderNumber before save
orderSchema.pre('save', async function () {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        const num = (count + 1).toString().padStart(5, '0');
        this.orderNumber = `ORD-${num}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);
