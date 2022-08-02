const express = require('express');

const { ListingController } = require('../controller');
const { validationMiddleware } = require('../middleware');
const { ListingValidation } = require('../validations');

const listingRouter = express.Router();
const selfRoute = 'me';

listingRouter.get('/', ListingController.getListing);
listingRouter.get('/:listingId', ListingController.getListingById);
listingRouter.get('/highestLowestPrice/:coin/:brokerType', ListingController.highestLowestPrice);

listingRouter.get(`/${selfRoute}/:userId`, ListingController.getMyListing);
listingRouter.get(`/${selfRoute}/:userId/:listingId`, ListingController.getMyListingById);
listingRouter.post(
  `/${selfRoute}/create`,
  validationMiddleware(ListingValidation.create),
  ListingController.createMyListing
);
listingRouter.put(
  `/${selfRoute}/update/:listingId`,
  validationMiddleware(ListingValidation.update),
  ListingController.updateMyListing
);
listingRouter.put(
  `/${selfRoute}/status`,
  validationMiddleware(ListingValidation.status),
  ListingController.activeInActiveMyListing
);

module.exports = listingRouter;
