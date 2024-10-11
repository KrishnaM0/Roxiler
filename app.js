const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
const Transactions = require("./models/transactions.js");
const path = require("path");

mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));


let filter;
let searchedQuery = async (searchQuery)=>{
    let priceQuery = Number(searchQuery);
    filter = {
        $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { category: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
        ]
    };
    if (!isNaN(priceQuery)) {
        filter.$or.push({ price: priceQuery });
    };

};

function getMonthName(month) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[Number(month) - 1];
}

app.get("/transactions", async (req, res) => {

    // Below commented code is for fetching API and inserting data into the database..
    // comment out these below two lines..Ones they are executed..
    // Otherwise the database will be continuesly inserted with the same datasets..

    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transactions.insertMany(data); 

    const searchQuery = req.query.searchQuery || ""; 
    const selectedMonth = req.query.month || "03";
    let currentPage = Number(req.query.page) || 1;
    let totalRecords = 0;
    try {
        let allRecords;
        if (selectedMonth === "0") {
            let skip = (currentPage - 1) * 10;
            allRecords = await Transactions.find().skip(skip).limit(10);
            totalRecords = await Transactions.countDocuments();
            if(searchQuery){
                searchedQuery(searchQuery);
                allRecords = await Transactions.find(filter);
                totalRecords = await Transactions.countDocuments(filter);
            };
        }
        else {
            searchedQuery(searchQuery);

            if (selectedMonth) {
                filter.dateOfSale = { $regex: `-${selectedMonth}-` };
            };

            allRecords = await Transactions.find(filter);
            totalRecords = await Transactions.countDocuments(filter);
        };

        const totalPages = Math.ceil(totalRecords / 10);

        let statistics = {};
        if (selectedMonth !== 0) {
            statistics = await Transactions.aggregate([
                {
                    $match: {
                        dateOfSale: { $regex: `-${selectedMonth}-` }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] } },
                        totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } }, 
                        totalNotSoldItems: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } } 
                    }
                }
            ]);
        };

        let categoryData = await Transactions.aggregate([
            {
                $match: {
                    dateOfSale: { $regex: `-${selectedMonth}-` }
                }
            },
            {
                $group: {
                    _id: "$category",
                    itemCount: { $sum: 1 }
                }
            },
            {
                $sort: { itemCount: -1 }
            }
        ]);

        const barChartData = await Transactions.aggregate([
            {
                $match: {
                    dateOfSale: { $regex: `-${selectedMonth}-` } 
                }
            },
            {
                $bucket: {
                    groupBy: "$price", 
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                    default: "901-above", 
                    output: {
                        itemCount: { $sum: 1 } 
                    }
                }
            },
            {
                $sort: { _id: 1 }  
            }
        ]);

        res.render("showRecords.ejs", { 
            allRecords, 
            selectedMonth, 
            currentPage, 
            totalPages, 
            statistics: statistics[0],
            selectedMonthName: getMonthName(selectedMonth),
            categoryData,
            barChartData
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).send("Error fetching transactions");
    };
});

app.listen(8080, () => {
    console.log("The app is listening on port 8080");
});
