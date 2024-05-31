const { skuModel } = require('../model/sku');
const { clientModel } = require('../model/client');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const csv = require('csv-parser');

const result = [];
//Create POST /upload
exports.uploadFile = async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const dataArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (rowData) => {
        dataArray.push(rowData);
      })
      .on('end', async () => {
        try {
          await clientModel.insertMany(dataArray, { ordered: false });
          console.log('CSV file successfully uploaded and processed');
          res.send('CSV file uploaded and processed');
        } catch (error) {
          console.error('Error occurred while uploading data:', error);
          res.status(400).json(error);
        }
      });
  }
  catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
};
//PATCH /bulkupload
exports.updateAwbBulkUpload = async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    console.log(req.file);
    const dataArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (rowData) => {
        dataArray.push(rowData);
      })
      .on('end', async () => {
        try {
          let docFinal = [];
          for (let i = 0; i < dataArray.length; i++) {
            const doc = await clientModel.updateMany({ orderid: dataArray[i].orderid }, { $set: { awb: dataArray[i].awb } });
            console.log(doc);
            docFinal.push(doc);
          }
          console.log('CSV file successfully uploaded and processed');
          res.json(docFinal);
        } catch (error) {
          console.error('Error occurred while uploading data:', error);
          res.status(400).json(error);
        }
      });
  }
  catch (error) {
    console.error(error);
  }
}

//Patch status update
exports.statusBulkupload = async (req, res) => {
  let today = new Date();

  let dd = today.getDate();
  let mm = today.getMonth() + 1;

  let yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  today = dd + '/' + mm + '/' + yyyy;
  console.log(today);

  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const dataArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (rowData) => {
        dataArray.push(rowData);
      })
      .on('end', async () => {
        try {
          let docFinal = [];
          for (let i = 0; i < dataArray.length; i++) {
            let update = {};
            if (dataArray[i].status === 'shipped') {
              update = { status: "shipped", shipped_date: today };
              console.log(update);
            } else if (dataArray[i].status === 'delivered') {
              update = { status: "delivered", delivered_date: today };
              console.log(update);
            } else {
              continue;
            }
            const doc = await clientModel.updateMany({ orderid: dataArray[i].orderid }, {
              $set: update
            });
            console.log(doc);
            docFinal.push(doc);
          }
          console.log('Status file successfully uploaded and processed');
          res.json(docFinal);
        } catch (error) {
          console.error('Error occurred while uploading status:', error);
          res.status(400).json(error);
        }
      });
  }
  catch (error) {
    console.error(error);
  }
}

//POST shopify upload
exports.shopifyUpload = async (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const orderChannelMap = {};
    const orderCountMap = {};
    const orderTotalMap = {};
    const dataArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (rowData) => {
        const orderid = rowData['Name'];
        if (orderCountMap[orderid]) {
          orderCountMap[orderid]++;
        } else {
          orderCountMap[orderid] = 1;
        }
      })
      .on('end', () => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (rowData) => {
            const orderid = rowData['Name'];
            if (rowData['Total']) {
              orderTotalMap[orderid] = rowData['Total'];
            }
            const occurrence = orderCountMap[orderid];
            const extractedData = {
              orderid,
              email: rowData['Email'],
              mobilenumber: rowData['Shipping Phone'],
              state: rowData['Shipping Province Name'],
              name: rowData['Shipping Name'],
              address: rowData['Shipping Address1'],
              city: rowData['Shipping City'],
              sku: rowData['Lineitem sku'],
              quantity: rowData['Lineitem quantity'],
              amount: (parseFloat(orderTotalMap[orderid]) / occurrence).toFixed(2),
              totalamount: rowData['Total'],
              date: rowData['Created at'],
            };
            const zip = rowData['Shipping Zip'].slice(1);
            extractedData.postalcode = zip;
            let channelname;
            if ((rowData['Tags'] && rowData['Tags'].includes('COD')) || rowData['Payment Method'] && rowData['Payment Method'].includes('COD')) {
              channelname = 'Shopify Customer';
            }
            else if (!channelname && orderChannelMap[orderid]) {
              channelname = orderChannelMap[orderid];
            }
            else if (!(rowData['Payment Method'] && rowData['Tags'])) {
              channelname = 'Shopify Customer';
            }
            else {
              channelname = 'Shopify Prepaid Customer';
            }

            extractedData.channelname = channelname;
            if (channelname) {
              orderChannelMap[orderid] = channelname;
            }
            dataArray.push(extractedData);
          })
          .on('end', async () => {
            try {
              await clientModel.insertMany(dataArray, { ordered: false });
              console.log('CSV file successfully uploaded and processed');
              res.send('CSV file uploaded and processed');
            } catch (error) {
              console.error('Error occurred while uploading data:', error);
              res.status(400).json(error);
            }
          });
      });
  }
  catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
}

//POST upload call order and update already existing orders

exports.deliveryUpload = async (req, res) => {
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
    const newDataArray = [];
    const updatedDataArray = [];
    // const maxUniqueIDCounters = await maxUniqueIdModel.find({});
    // const uniqueCountersMap = {};

    // maxUniqueIDCounters.forEach(counter => {
    //   uniqueCountersMap[counter.source] = counter.maxID;
    // });

    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      const orderid = rowData['Reference No.'];
      const sku = await skuModel.findOne({ channelSKU: rowData['Lineitem sku'] })
      if (!sku) {
        await skuModel.create({ channelSKU: rowData['Lineitem sku'] });
      }
      // const date = rowData['Pick Up Date'];
      // const lastTwoChar = Number(date.slice(-2));
      // const month = Number(date.slice(3, 5));

      let unique_id;
      const source = orderid[0] == '#' || 'K' ? 'K' : 'C';
      // let uniqueCounter = uniqueCountersMap[source];
      // unique_id = `${source}${uniqueCounter}-${month > 3 ? lastTwoChar : lastTwoChar - 1}`;
      unique_id = `${source}S`
      // uniqueCountersMap[source]++;

      const existingEntry = await clientModel.findOne({ orderid: orderid });
      if (existingEntry && existingEntry.status != 'return_recieved') {
        const updatedData = {
          status: rowData["Current Status"].toLowerCase(),
          delivered_date: rowData["Delivered Date"],
          shipped_date: rowData["Pick Up Date"],
          awb: rowData["Waybill"],
          unique_id: unique_id,
        }
        updatedDataArray.push({ query: { orderid }, update: { $set: updatedData } });
      }
      else if (existingEntry && existingEntry.status === 'return_recieved') {
        return;
      }
      else {
        const extractedData = {
          orderid,
          name: rowData['Consignee Name'],
          city: rowData['City'],
          sku: rowData['Product Description'],
          quantity: "1",
          amount: parseFloat(rowData['Amount']).toString() || '0',
          totalamount: rowData['Amount'] || '0',
          date: rowData['Pick Up Date'],
          postalcode: rowData['PIN'],
          status: rowData["Current Status"].toLowerCase(),
          delivered_date: rowData["Delivered Date"],
          shipped_date: rowData["Pick Up Date"],
          awb: rowData["Waybill"],
          unique_id: unique_id,
          channelname: "Calling Customer",
        };
        newDataArray.push(extractedData);
      }
    },
      async () => {
        // Bulk operations for updating existing entries and inserting new ones
        const bulkOps = [];
        if (updatedDataArray.length > 0) {
          updatedDataArray.forEach(({ query, update }) => {
            bulkOps.push({
              updateOne: {
                filter: query,
                update: update,
              },
            });
          });
        }
        // console.log("bulkOPs->", bulkOps);
        if (newDataArray.length > 0) {
          for (let i = 0; i < newDataArray.length; i++) {
            bulkOps.push({
              insertOne: {
                document: newDataArray[i]
              }
            });
          }
        }

        if (bulkOps.length > 0) {
          try {
            await clientModel.bulkWrite(bulkOps, { ordered: false });
            console.log('Delivery Orders Uploaded');
          } catch (error) {
            console.log("Error bulkwriting->", error);
          }
        }
        res.send('CSV file uploaded and processed');
      });
    // await maxUniqueIdModel.updateOne({ source: 'K' }, { maxID: uniqueCountersMap['K'] });
    // await maxUniqueIdModel.updateOne({ source: 'C' }, { maxID: uniqueCountersMap['C'] });
  } catch (error) {
    handleError(error, res);
  }
};
