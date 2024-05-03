const { clientModel } = require('../model/client');
const csv = require('csv-parser');
const fs = require('fs');
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
        console.log(rowData);
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
        console.log(rowData);
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
    console.log(req.file);
    const dataArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (rowData) => {
        console.log(rowData);
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