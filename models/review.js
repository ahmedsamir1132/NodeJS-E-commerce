const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide rating']
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100,
        required: [true, 'Please provide review title']
    },
    comment: {
        type: String,
        required: [true, 'Please provide review text']

    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true
    }
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true })

reviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        {
            '$match': {
                'product': productId
            }
        }, {
            '$group': {
                '_id': '$product',
                'averageRating': {
                    '$avg': '$rating'
                },
                'numOfReviews': {
                    '$sum': 1
                }
            }
        }
    ]);

    try {
        await this.model('Product').findOneAndUpdate(
            { _id: productId },
            { averageRating: Math.ceil(result[0]?.averageRating || 0), numOfReviews: result[0]?.numOfReviews || 0});
    }
    catch (error) {
        console.log(error)
    }
}

reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product);
})

module.exports = mongoose.model('Review', reviewSchema);