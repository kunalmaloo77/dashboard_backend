const { skuModel } = require('../model/sku');
const fs = require('fs');
const csv = require('csv-parser');

exports.uploadSku = async (req, res) => {
  console.log("HI");
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const handleError = (error, res) => {
    console.error('Error occurred:', error);
    res.status(400).json({ error: 'An error occurred.' });
  };

  const processCSV = (stream, onData, onEnd) => {
    const parser = csv();
    const promises = [];

    stream.pipe(parser)
      .on('data', (data) => {
        const promise = onData(data);
        promises.push(promise);
      })
      .on('error', (error) => handleError(error, res))
      .on('end', async () => {
        await Promise.all(promises);
        onEnd();
      });
  };
  try {
    skuArray = [];
    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      const sku = await skuModel.findOne({ channelSKU: rowData['channelSKU'] });
      if (!sku) {
        skuArray.push({
          channelSKU: rowData['channelSKU'].trim(),
          mainSKU: rowData['mainSKU'],
          size: rowData['size']
        });
      }
    }, async () => {
      // Bulk operations for updating existing entries and inserting new ones
      const bulkSkuOps = [];

      if (skuArray.length > 0) {
        for (let i = 0; i < skuArray.length; i++) {
          bulkSkuOps.push({
            insertOne: {
              document: skuArray[i]
            }
          })
        }
      }
      // console.log("bulkSkuOPs->", bulkSkuOps)

      if (bulkSkuOps.length > 0) {
        try {
          await skuModel.bulkWrite(bulkSkuOps, { ordered: false });
          console.log("Sku Uploaded");
        } catch (error) {
          console.log("Error bulkwriting sku->", error);
        }
      }

      res.send('CSV file uploaded and processed');
    });

  } catch (error) {
    handleError(error, res);
  }
}