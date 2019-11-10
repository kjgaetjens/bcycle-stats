const express = require('express')
const app = express()
const cors = require('cors')
const mongo = require('mongodb').MongoClient
const axios = require('axios')
require('dotenv').config()

//Middleware
app.use(cors())
app.use(express.json())
//not sure if i'll need this parser actually
app.use(express.urlencoded({extended: true}))

//will update PORT once hosted
const PORT = 8080

// MongoDB connection params
const MONGO_USERNAME = process.env.MONGO_USERNAME
const MONGO_PASSWORD = process.env.MONGO_PASSWORD
const MONGO_DATABASE = process.env.MONGO_DATABASE

// Connect to MongoDB and create route for refreshing MongoDB data with data from dataset APIs
mongo.connect(`mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@bcycle-stats-mezgf.gcp.mongodb.net/${MONGO_DATABASE}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true}, (error,client) => {
    if(!error) {
        console.log('Successfully connected to MongoDB database')
        const db = client.db('test')

        //Delete current MongoDB bus stop, rail stop, and bicycle station data. Pull current bus stop, rail stop, and bicycle station data and add to MonogDB.
        app.post('/refresh-data', async (req, res) => {
            //add error handling
        
            let busStopResult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_9.geojson')
            await db.collection('busstops').deleteMany({})
            await db.collection('busstops').insertMany(busStopResult.data.features)

            let railStopResult = await axios('https://opendata.arcgis.com/datasets/c2274084571d4f968cac09a608b868c4_2.geojson')
            await db.collection('railstops').deleteMany({})
            await db.collection('railstops').insertMany(railStopResult.data.features)

            let bicycleStationResult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_2.geojson')
            await db.collection('bicyclestations').deleteMany({})
            await db.collection('bicyclestations').insertMany(bicycleStationResult.data.features)

            //update
            res.send('success')
        })

    } else {
        console.log(error)
    }
})

app.get('/', (req, res) => {
    res.send('test')
})


app.listen(PORT, () => {
    console.log("Server is running...")
})