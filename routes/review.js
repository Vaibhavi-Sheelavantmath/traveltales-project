const express = require("express");
const router = express.Router({mergeParams: true}); // adding merge params to merge the url because the common url will remain inside the app.js file and the parameters will not come to this file.
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, validateReview, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

//REVIEWS
//POST REVIEW ROUTE
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//DELETE REVIEW ROUTE
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;