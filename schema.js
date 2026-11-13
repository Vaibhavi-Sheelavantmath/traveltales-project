
const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),

    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),

    image: Joi.object({
      url: Joi.string().allow("", null),
      filename: Joi.string().allow("", null),
    }).optional(),
  }).required(),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});

module.exports = {
  listingSchema,
  reviewSchema,
};
