const mongoose = require("mongoose");

let transactionSchema = new mongoose.Schema({
        id : String,
        title: String,
        price: Number,
        description: String,
        category: String,
        image: String,
        sold: Boolean,
        dateOfSale: String,
});

let Transactions = mongoose.model("Transactions", transactionSchema);

module.exports = Transactions;