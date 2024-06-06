const express = require('express');
const multer = require('multer');
const uploadController = require('../controller/upload')
const skuController = require('../controller/skuUpload')
const upload = multer({ dest: 'uploads/' });


const uploadRouter = express.Router();

uploadRouter
  .post('/', upload.single('csv'), uploadController.uploadFile)
  .post('/shopify', upload.single('csv'), uploadController.shopifyUpload)
  .post('/delivery', upload.single('csv'), uploadController.deliveryUpload)
  .post('/skuUpload', upload.single('csv'), skuController.uploadSku)
  .post('/pagazo', upload.single('csv'), uploadController.pagazoUpload)
  .post('/dealshunter', upload.single('csv'), uploadController.dealHunterUpload)
  .patch('/awb/bulkupload', upload.single('csv'), uploadController.updateAwbBulkUpload)
  .patch('/status', upload.single('csv'), uploadController.statusBulkupload)
  .patch('/updateDate', uploadController.updateDate)

module.exports = uploadRouter;