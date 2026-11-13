const Listing = require("../models/listing.js");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

// SEARCH LOCATIONS USING NOMINATIM
module.exports.searchLocations = async (req, res) => {
  const { q } = req.query;

  if (typeof q !== "string" || q.trim().length < 3) {
    return res.status(400).json({
      error: "Please enter at least 3 characters.",
    });
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: q.trim(),
          format: "jsonv2",
          limit: 5,
          addressdetails: 1,
          "accept-language": "en",
        },
        headers: {
          "User-Agent": "TravelTales/1.0",
        },
        timeout: 10000,
      },
    );

    const locations = response.data.map((place) => ({
      display_name: place.display_name,
      latitude: place.lat,
      longitude: place.lon,
      type: place.type,
    }));

    res.json(locations);
  } catch (error) {
    console.error("Nominatim error:", error.message);

    res.status(502).json({
      error: "Unable to search locations. Please try again.",
    });
  }
};

module.exports.createListing = async (req, res) => {
  const { latitude, longitude, ...listingData } = req.body.listing;

  const newListing = new Listing(listingData);

  newListing.owner = req.user._id;

  newListing.image = {
    url: req.file.path,
    filename: req.file.filename,
  };

  // Save coordinates in GeoJSON format.
  newListing.geometry = {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
  };

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/,w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const { latitude, longitude, ...listingData } = req.body.listing;

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }

  // Update listing details.
  Object.assign(listing, listingData);

  // Update GeoJSON coordinates.
  listing.geometry = {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
  };

  // Update image only if a new one was uploaded.
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
