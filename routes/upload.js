const express = require('express');
const uploadController = require('../controller/upload')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


const uploadRouter = express.Router();

uploadRouter
  .post('/', upload.single('csv'), uploadController.uploadFile)
  .post('/shopify', upload.single('csv'), uploadController.shopifyUpload)
  .post('/delivery', upload.single('csv'), uploadController.deliveryUpload)
  .patch('/awb/bulkupload', upload.single('csv'), uploadController.updateAwbBulkUpload)
  .patch('/status', upload.single('csv'), uploadController.statusBulkupload)

module.exports = uploadRouter;