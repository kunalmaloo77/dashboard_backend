const express = require('express');
const uploadController = require('../controller/upload')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


const uploadRouter = express.Router();

uploadRouter
  .post('/', upload.single('csv'), uploadController.uploadFile)
  .patch('/awb/bulkupload', upload.single('csv'), uploadController.updateAwbBulkUpload)
  // .patch('/confirmed/bulkupload', upload.single('csv'), uploadController.updateConfirmedBulkUpload)
  .patch('/status', upload.single('csv'), uploadController.statusBulkupload)

module.exports = uploadRouter;