const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const axios = require('axios')
require('dotenv').config()

//need to bring in models

app.use(cors())
app.use(express.json())

//not sure if i'll need this parser actually
app.use(express.urlencoded({extended: true}))

//will update PORT once hosted
const PORT = 8080

// MongoDB connection
const MONGO_USERNAME = process.env.MONGO_USERNAME
const MONGO_PASSWORD = process.env.MONGO_PASSWORD
const MONGO_DATABASE = process.env.MONGO_DATABASE

mongoose.connect(`mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@bcycle-stats-mezgf.gcp.mongodb.net/${MONGO_DATABASE}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true}, (error) => {
    if(!error) {
        console.log('Successfully connected to MongoDB database')
    } else {
        console.log(error)
    }
})

app.get('/', (req, res) => {
    res.send('test')
})

app.post('/refresh-data', async (req, res) => {
    //add error handling

    let busStopResult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_9.geojson')
    let railStopResult = await axios('https://opendata.arcgis.com/datasets/c2274084571d4f968cac09a608b868c4_2.geojson')
    let bicycleStationresult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_2.geojson')

    // console.log(result.data.features[0])
    // connect to mongo and push
})



app.listen(PORT, () => {
    console.log("Server is running...")
})