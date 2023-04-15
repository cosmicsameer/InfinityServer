const MongoClient = require('mongodb').MongoClient;
// Connect to MongoDB
const url = 'mongodb+srv://sameeratpug:infinity@cluster0.rnwegk7.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    const custCollection = client.db("infinity").collection("customer");
    const empCollection = client.db("infinity").collection("emp");
    custCollection.insertOne({ id: 1, name: "ram", password: "123456" });
    empCollection.insertOne({ id: 1, name: "Admin", password: "infinity" });
    empCollection.insertOne({ id: 2, name: "Harish", password: "123456" });
  }
});


