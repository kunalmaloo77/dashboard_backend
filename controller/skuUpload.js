const { skuModel } = require('../model/sku');
const fs = require('fs');
const csv = require('csv-parser');
const { clientModel } = require('../model/client');

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

exports.saveUnmappedSku = async (req, res) => {
  const data = req.body.unMappedSku;
  // console.log(data);
  try {
    const newItem = await skuModel.insertMany(data, { ordered: false })
    res.status(201).send(newItem);
  } catch (error) {
    console.log(error, "<-unmapped upload error");
  }
}

exports.getUnmappedSku = async (req, res) => {
  try {
    const response = await skuModel.find({ mainSKU: { $exists: false } })
    res.status(200).json(response);
  } catch (error) {
    res.status(404);
    console.log(error);
  }
}

exports.getfullUnmappedSku = async (req, res) => {
  console.log("hi");
  try {
    const respo = await clientModel.find({});
    // console.log(respo);
    const allSKUs = await skuModel.find({}).select('channelSKU');
    const skuSet = new Set(allSKUs.map(item => item.channelSKU));
    const notFound = respo.filter(item => !skuSet.has(item.sku) && item.sku.length > 0);
    res.status(200).json(notFound);
  } catch (error) {
    res.status(404);
    console.log(error);
  }
}