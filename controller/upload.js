const { clientModel } = require('../model/client');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');
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

// exports.updateConfirmedBulkUpload = async (req, res) => {
//   try {
//     console.log(req.file);
//     const dataArray = [];
//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on('data', async (rowData) => {
//         console.log(rowData);
//         dataArray.push(rowData);
//       })
//       .on('end', async () => {
//         try {
//           let docFinal = [];
//           for (let i = 0; i < dataArray.length; i++) {
//             const doc = await clientModel.updateMany({ orderid: dataArray[i].orderid }, { $set: { status: dataArray[i].status } });
//             console.log(doc);
//             docFinal.push(doc);
//           }
//           console.log('CSV file successfully uploaded and processed');
//           res.json(docFinal);
//         } catch (error) {
//           console.error('Error occurred while uploading data:', error);
//           res.status(400).json(error);
//         }
//       });
//   }
//   catch (error) {
//     console.error(error);
//   }
// }
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
            } else if (rowData['Tags']) {
              channelname = 'Shopify Prepaid Customer';
            } else {
              channelname = '';
            }
            if (!channelname && orderChannelMap[orderid]) {
              channelname = orderChannelMap[orderid];
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
    stream.pipe(parser)
      .on('data', onData)
      .on('error', (error) => handleError(error, res))
      .on('end', onEnd);
  };

  try {
    const newDataArray = [];
    const updatedDataArray = [];
    const promises = [];

    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      const orderid = rowData['Reference No.'];
      const promise = (async () => {
        const existingEntry = await clientModel.findOne({ orderid: orderid });
        console.log("Existing entry->", existingEntry);

        if (existingEntry) {
          const updatedData = {
            status: rowData["Current Status"].toLowerCase(),
            delivered_date: rowData["Delivered Date"],
            shipped_date: rowData["Pick Up Date"],
            awb: rowData["Waybill"],
          };
          updatedDataArray.push({ query: { orderid }, update: { $set: updatedData } });
          console.log("Updated Data array", updatedDataArray);
        } else {
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
          };
          newDataArray.push(extractedData);
        }
      })();
      promises.push(promise);
    }, async () => {
      await Promise.all(promises);

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
      console.log("New data array->", newDataArray);
      if (newDataArray.length > 0) {
        try {
          for (const newData of newDataArray) {
            await clientModel.create(newData);
          }
          console.log('Inserted new entries');
        } catch (error) {
          console.error('Error inserting new entries:', error);
        }
      }

      console.log("Theses are bulkops->", bulkOps);

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
  } catch (error) {
    handleError(error, res);
  }
};
