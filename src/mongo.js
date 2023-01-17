const { MongoClient } = require('mongodb')

const uri = "mongodb+srv://anfwksel1229:anfwksel10@cluster0.mlbwk2k.mongodb.net/test"
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

module.exports = client