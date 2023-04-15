const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
// Connect to MongoDB
const url = 'mongodb+srv://sameeratpug:infinity@cluster0.rnwegk7.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const jwt = require('jsonwebtoken');
const secretKey = "1234567890";

client.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Connected to MongoDB');
  }
});

// Create an Express app
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/getCustIssues/', (req, res) => {
  const custId = req.query.custId;
  const collection = client.db('infinity').collection('customer');
  collection.findOne({ id: parseInt(custId) }, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});

app.get('/api/getAllIssues', (req, res) => {
  const collection = client.db('infinity').collection('issues');
  collection.find().toArray((err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});

app.get('/api/getemp', (req, res) => {
  const collection = client.db('infinity').collection('emp');
  collection.find().toArray((err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});

app.get('/api/getEmpDataById', (req, res) => {
  const empId = req.query.empId;
  const collection = client.db('infinity').collection('emp');
  collection.findOne({ id: parseInt(empId) }, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});


app.get('/api/getUnallocIssue', (req, res) => { // todo token work 
  const collection = client.db('infinity').collection('issues');
  collection.find({ assigned: "NO" }).toArray((err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});


app.get('/api/getAllocIssue', (req, res) => { // todo token work 
  const collection = client.db('infinity').collection('issues');
  collection.find({ assigned: "YES" }).toArray((err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.json(data);
    }
  });
});

app.post('/api/submitIssue', (req, res) => {
  const data = req.body.data;
  const custCollection = client.db("infinity").collection("customer");
  const issueCollection = client.db("infinity").collection("issues");

  issueCollection.countDocuments((err, issueResult) => {
    let curIssueId = issueResult;
    if (curIssueId || curIssueId === 0) {
      let dataToAdd = { id: curIssueId + 1, prod: data.prod, issues: data.issues, date: Date.now(), desc: data.desc };
      custCollection.updateOne({ id: parseInt(data.custId) }, { $push: { issues: dataToAdd } }, (err, result) => {
        if (result.result) {
          res.status(200).json({ message: "OK" });
        } else res.status(401).json({ message: "Not have access/internal error" });
      });
      custCollection.findOne({ id: parseInt(data.custId) }, (err, result) => {
        dataToAdd.custName = result.name;
        dataToAdd.custId = data.custId;
        dataToAdd.assigned = "NO";
        issueCollection.insertOne(dataToAdd);
      })
    }
  })
});

app.post('/api/assignIssue', (req, res) => {
  const data = req.body.data;
  const issueCollection = client.db("infinity").collection("issues");
  const empCollection = client.db("infinity").collection("emp");
  issueCollection.findOne({ id: parseInt(data.issueId) }, (err, result) => {
    if (result) {
      result.status = "Open";
      result.assigned = "YES";
      empCollection.updateOne({ id: parseInt(data.id) }, { $push: { issues: result } });
      issueCollection.updateOne({ id: parseInt(data.issueId) }, { $set: { status: "Open", empId: parseInt(data.id), empName: data.empName, assigned: "YES" } });
      res.status(200).json({ message: "OK" });
    } else res.status(401).json({ message: "Not have access/internal error" });
  });
});



app.post('/api/changeIssueStatus', (req, res) => {
  const data = req.body.data;
  const issueCollection = client.db("infinity").collection("issues");
  const empCollection = client.db("infinity").collection("emp");
  issueCollection.findOne({ id: parseInt(data.issueId) }, (err, result) => {
    if (result) {
      result.status = data.status;
      result.assigned = "YES";
      issueCollection.updateOne({ id: parseInt(data.issueId) }, { $set: { status: data.status } });
      empCollection.updateOne(
        { id: parseInt(data.id) },
        { $set: { "issues.$[element].status": data.status } },
        { arrayFilters: [{ "id": data.issueId }] })
      issueCollection.updateOne({ id: parseInt(data.issueId) }, { $set: { status: data.status } });
      res.status(200).json({ message: "OK" });
    } else res.status(401).json({ message: "Not have access/internal error" });
  });
});

app.post('/api/login', (req, res) => {
  const data = req.body.data;
  const coll = parseInt(data.loginType) === 2 ? "customer" : "emp";
  const collection = client.db("infinity").collection(coll);
  const payload = { name: data.name, password: data.password }
  collection.findOne(payload, (err, result) => {
    if (result) {
      const token = jwt.sign(payload, secretKey);
      res.status(200).json({ message: "Authenticated", token: token, id: result.id });
    } else res.status(401).json({ message: "wrong login" });
  });
});


const port = 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

