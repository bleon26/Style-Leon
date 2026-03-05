const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    bgGradient: {
        type: [String],
        default: ['#1a1a2e', '#0f3460']
    },
    tag: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    buttons: [{
        text: String,
        action: String,
        style: {
            type: String,
            default: 'btn-primary'
        }
    }],
    showStats: {
        type: Boolean,
        default: false
    },
    stats: [{
        value: String,
        label: String
    }],
    showTimer: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Carousel', carouselSchema);
