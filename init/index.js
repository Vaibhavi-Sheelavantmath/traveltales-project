const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/traveltales";

async function main(){
    mongoose.connect(MONGO_URL);
}

main().then(() => {
    console.log("Connected to DB.")
}).catch((err) => {
    console.log(err);
})


const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: "6a872a6b48333e06ab6abdef"}));
    await Listing.insertMany(initData.data);
    console.log("Data initialized.");
};

initDB();