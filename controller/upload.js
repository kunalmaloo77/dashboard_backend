const { skuModel } = require('../model/sku');
const { clientModel } = require('../model/client');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const csv = require('csv-parser');
const { sampleClientModel } = require('../model/clientsample');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat);
dayjs.extend(utc);

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
    const filePath = req.file.path;

    // First pass: Count occurrences of each order ID
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (rowData) => {
          const orderid = rowData['Name'];
          orderCountMap[orderid] = (orderCountMap[orderid] || 0) + 1;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Second pass: Process data and create records
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (rowData) => {
          const orderid = rowData['Name'];
          const occurrence = orderCountMap[orderid];
          const date = rowData['Created at'];

          if (rowData['Total']) {
            orderTotalMap[orderid] = rowData['Total'];
          }

          let standardizedDate;
          standardizedDate = dayjs(date).toDate();

          const extractedData = {
            orderid: orderid,
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
            date: standardizedDate,
            postalcode: rowData['Shipping Zip']?.slice(1),
          };

          let channelname = 'Shopify Prepaid Customer';
          if ((rowData['Tags'] && rowData['Tags'].includes('COD')) || (rowData['Payment Method'] && rowData['Payment Method'].includes('COD'))) {
            channelname = 'Shopify Customer';
          } else if (orderChannelMap[orderid]) {
            channelname = orderChannelMap[orderid];
          } else if (!(rowData['Payment Method'] || rowData['Tags'])) {
            channelname = 'Shopify Customer';
          }

          extractedData.channelname = channelname;
          orderChannelMap[orderid] = channelname;
          dataArray.push(extractedData);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert data into the database
    await clientModel.insertMany(dataArray, { ordered: false });
    console.log('CSV file successfully uploaded and processed');
    res.status(200).send('CSV file uploaded and processed');
  } catch (error) {
    console.log('Error occurred while uploading data:', error);
    res.status(400).json({ error: 'An error occurred while processing the file.' });
  }
};

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

    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      let orderStatus;
      if (rowData['Current Status'] === 'RETURNING_TO_ORIGIN') {
        orderStatus = 'return_intransit';
      }
      else if (rowData['Current Status'] === 'OUT_FOR_DELIVERY') {
        orderStatus = 'shipped';
      }
      else if (rowData['Current Status'] === 'RETURNED_TO_ORIGIN') {
        orderStatus = 'return_delivered';
      }
      else if (rowData['Current Status'] === 'READY_FOR_PICKUP') {
        orderStatus = 'ready_to_ship';
      }
      else {
        orderStatus = rowData['Current Status'];
      }
      const orderid = rowData['Reference No.'];
      let unique_id;
      const source = orderid[0] == '#' || orderid[0] == 'K' ? 'K' : 'C';
      unique_id = `${source}S`
      let date1 = rowData['Pick Up Date'];
      // console.log('date1->', date1);
      let date = rowData['Delivered Date'] && rowData['Delivered Date'];
      // console.log('date->', date);
      let pickUpDate, deliveredDate;
      pickUpDate = date1 && dayjs.utc(date1, 'DD-MM-YYYY').toDate();
      // console.log("OD->", orderDate);
      deliveredDate = date && dayjs.utc(date, 'DD-MM-YYYY').toDate();

      const existingEntry = await clientModel.findOne({ orderid: orderid });
      if (existingEntry && existingEntry.status != 'return_recieved') {
        const updatedData = {
          status: orderStatus.toLowerCase(),
          ...(deliveredDate && { delivered_date: deliveredDate }),
          shipped_date: pickUpDate,
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
          date: pickUpDate,
          postalcode: rowData['PIN'],
          status: orderStatus.toLowerCase(),
          ...(deliveredDate && { delivered_date: deliveredDate }),
          shipped_date: pickUpDate,
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
  } catch (error) {
    handleError(error, res);
  }
};

exports.pagazoUpload = async (req, res) => {
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
    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      const orderid = rowData['Order ID'];
      let date1 = rowData['Order Date'];
      // console.log('date1->', date1);
      let date = rowData['Settlement Date'] != 'NA' && rowData['Settlement Date'];
      // console.log('date->', date);
      let orderDate, settlementDate;
      orderDate = date1 && dayjs.utc(date1, 'HH:mm A, DD/MM/YYYY').toDate();
      // console.log("OD->", orderDate);
      settlementDate = date && dayjs.utc(date, 'DD/MM/YYYY HH:mm').toDate();
      // console.log("ST->", settlementDate);

      // const sku = await skuModel.findOne({ channelSKU: rowData['Sku ID'] })
      // if (!sku) {
      //   await skuModel.create({ channelSKU: rowData['Sku ID'] });
      // }

      const existingEntry = await clientModel.findOne({ orderid: orderid });
      if (existingEntry && existingEntry.status != 'return_recieved') {
        const updatedData = {
          status: rowData["Order Status"].toLowerCase(),
          delivered_date: rowData["Delivered Date"],
          shipped_date: rowData["Pick Up Date"],
        }
        updatedDataArray.push({ query: { orderid }, update: { $set: updatedData } });
      }
      else if (existingEntry && existingEntry.status === 'return_recieved') {
        return;
      }
      else {
        let orderStatus;
        if (rowData['Order Status'] == 'HANDOVER' || rowData['Order Status'] == 'PRINT') {
          orderStatus = 'ready_to_ship';
        }
        else if (rowData['Order Status'] == 'RTO_ACKNOWLEDGED' || rowData['Order Status'] == 'RTO_DELIVERED') {
          orderStatus = 'return_delivered';
        }
        else if (rowData['Order Status'] == 'RTO_INITIATED') {
          orderStatus = 'return_intransit';
        }
        else if (rowData['Order Status'] == 'IN-TRANSIT') {
          orderStatus = 'shipped';
        }
        else {
          orderStatus = rowData['Order Status'];
        }

        let data = rowData['Customer Address'];

        function reverseString(str) {
          return str.split('').reverse().join('');
        }

        function splitAddress(address) {
          // Reverse the address string
          const reversedAddress = reverseString(address);
          // Split the reversed string based on the first occurrence of '-'
          const parts = reversedAddress.split('-', 2);
          // Extract the reversed PIN and the rest of the reversed address
          const reversedPIN = parts[0]?.trim();
          const restOfReversedAddress = reversedAddress?.slice(8).trim();
          // Further split the rest of the reversed address by the first occurrence of ','
          const stateCityAddressParts = restOfReversedAddress.split(',', 3);
          // Extract the reversed State, City, and Address
          const reversedState = stateCityAddressParts[0]?.trim();
          const reversedCity = stateCityAddressParts[1]?.trim();
          const reversedRestOfAddressWithState = restOfReversedAddress.replace(reversedCity + ' ,', '');
          const reversedRestOfAddress = reversedRestOfAddressWithState.replace(reversedState + ' ,', '');
          // Reverse each part back to get the correct order
          const PIN = reverseString(reversedPIN);
          const State = reverseString(reversedState);
          const City = reverseString(reversedCity);
          const Address = reverseString(reversedRestOfAddress);

          return { PIN, State, City, Address };
        }

        const { PIN, State, City, Address } = splitAddress(data);

        const extractedData = {
          orderid,
          unique_id: 'PS',
          name: rowData['Customer Name'],
          sku: rowData['Sku ID'],
          quantity: rowData['Quantity'],
          amount: rowData['Final Selling Price'] || '0',
          totalamount: rowData['Final Selling Price'] || '0',
          date: orderDate,
          postalcode: PIN,
          city: City,
          state: State,
          address: Address,
          status: orderStatus.toLowerCase(),
          shipped_date: orderDate,
          awb: rowData["AWB NO."],
          channelname: "Pagazo Customer",
          ...(settlementDate && { delivered_date: settlementDate }),
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
  } catch (error) {
    handleError(error, res);
  }
};

exports.dealHunterUpload = async (req, res) => {
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
    processCSV(fs.createReadStream(req.file.path), async (rowData) => {
      const orderid = rowData['Order ID'];
      let date1 = rowData['Order Date'];
      // console.log('date1->', date1);
      let date = rowData['Settlement Date'] != 'NA' && rowData['Settlement Date'];
      // console.log('date->', date);
      let orderDate, settlementDate;
      orderDate = date1 && dayjs.utc(date1, 'HH:mm A, DD/MM/YYYY').toDate();
      // console.log("OD->", orderDate);
      settlementDate = date && dayjs.utc(date, 'DD/MM/YYYY HH:mm').toDate();
      // console.log("ST->", settlementDate);

      // const sku = await skuModel.findOne({ channelSKU: rowData['Sku ID'] })
      // if (!sku) {
      //   await skuModel.create({ channelSKU: rowData['Sku ID'] });
      // }

      const existingEntry = await clientModel.findOne({ orderid: orderid });
      if (existingEntry && existingEntry.status != 'return_recieved') {
        const updatedData = {
          status: rowData["Order Status"].toLowerCase(),
          delivered_date: rowData["Delivered Date"],
          shipped_date: rowData["Pick Up Date"],
        }
        updatedDataArray.push({ query: { orderid }, update: { $set: updatedData } });
      }
      else if (existingEntry && existingEntry.status === 'return_recieved') {
        return;
      }
      else {
        let orderStatus;
        if (rowData['Order Status'] == 'HANDOVER' || rowData['Order Status'] == 'PRINT') {
          orderStatus = 'ready_to_ship';
        }
        else if (rowData['Order Status'] == 'RTO_ACKNOWLEDGED' || rowData['Order Status'] == 'RTO_DELIVERED') {
          orderStatus = 'return_delivered';
        }
        else if (rowData['Order Status'] == 'RTO_INITIATED') {
          orderStatus = 'return_intransit';
        }
        else if (rowData['Order Status'] == 'IN-TRANSIT') {
          orderStatus = 'shipped';
        }
        else {
          orderStatus = rowData['Order Status'];
        }

        let data = rowData['Customer Address'];

        function reverseString(str) {
          return str.split('').reverse().join('');
        }

        function splitAddress(address) {
          // Reverse the address string
          const reversedAddress = reverseString(address);
          // Split the reversed string based on the first occurrence of '-'
          const parts = reversedAddress.split('-', 2);
          // Extract the reversed PIN and the rest of the reversed address
          const reversedPIN = parts[0]?.trim();
          const restOfReversedAddress = reversedAddress?.slice(8).trim();
          // Further split the rest of the reversed address by the first occurrence of ','
          const stateCityAddressParts = restOfReversedAddress.split(',', 3);
          // Extract the reversed State, City, and Address
          const reversedState = stateCityAddressParts[0]?.trim();
          const reversedCity = stateCityAddressParts[1]?.trim();
          const reversedRestOfAddressWithState = restOfReversedAddress.replace(reversedCity + ' ,', '');
          const reversedRestOfAddress = reversedRestOfAddressWithState.replace(reversedState + ' ,', '');
          // Reverse each part back to get the correct order
          const PIN = reverseString(reversedPIN);
          const State = reverseString(reversedState);
          const City = reverseString(reversedCity);
          const Address = reverseString(reversedRestOfAddress);

          return { PIN, State, City, Address };
        }

        const { PIN, State, City, Address } = splitAddress(data);

        const extractedData = {
          orderid,
          unique_id: 'DS',
          name: rowData['Customer Name'],
          sku: rowData['Sku ID'],
          quantity: rowData['Quantity'],
          amount: rowData['Final Selling Price'] || '0',
          totalamount: rowData['Final Selling Price'] || '0',
          date: orderDate,
          postalcode: PIN,
          city: City,
          state: State,
          address: Address,
          status: orderStatus.toLowerCase(),
          shipped_date: orderDate,
          awb: rowData["AWB NO."],
          channelname: "Deals Hunter Customer",
          ...(settlementDate && { delivered_date: settlementDate }),
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
  } catch (error) {
    handleError(error, res);
  }
};

exports.updateDate = async (req, res) => {
  try {
    // Update documents with dates in the desired format
    const updateResult = await sampleClientModel.updateMany(
      { "date": { $not: { $type: Date } } },  // Exclude documents with existing Date objects
      { $set: { "date": { $dateFromString: { dateString: "$date", format: "%Y-%m-%d %H:%M:%S %z" } } } }  // Convert using $dateFromString
    );

    console.log(`${updateResult.modifiedCount} documents updated successfully.`);
    client.close();
  } catch (error) {
    console.error(error);
  }
}
