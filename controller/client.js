const { clientModel } = require('../model/client');

//Read all /clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await clientModel.find();
        res.json(clients);
    }
    catch (error) {
        console.log(error);
    }  
};

//Read single GET /clients/:id
exports.getClient = async(req, res) => {
    const id = req.params.id;
    const client = await clientModel.findById(id);
    res.json(client);
};

//Create POST /clients
exports.createClient = async(req, res) => {
    try {
        const clientDoc = new clientModel(req.body);
        console.log(req.body);
        const doc = await clientDoc.save();
        console.log(doc);
        res.status(201).json(doc);
    } 
    catch (error) {
        console.error(error);
        res.status(400).json(error);
    }          
};

// Replace PUT /clients/:id
exports.replaceClient = async (req, res) => {
    const id = req.params.id;
    try{
        const doc = await clientModel.findOneAndReplace({_id:id},req.body,{new:true})
        res.status(201).json(doc);
        }
        catch(err){
          console.log(err);
          res.status(400).json(err);
        }
};

//Update PATCH /clients/:id
exports.updateClient =  async (req, res) => {
    const id = req.params.id;
    try{
    const doc = await clientModel.findOneAndUpdate({_id:id},req.body,{new:true})
    res.status(201).json(doc);
    }
    catch(err){
      console.log(err);
      res.status(400).json(err);
    }
};

//Delete DELETE /clients/:id
exports.deleteClient = async (req, res) => {
    try{
        const doc = await clientModel.findOneAndDelete({_id:id})
        res.status(201).json(doc);
    }
    catch(err){
        console.log(err);
        res.status(400).json(err);
    }
};