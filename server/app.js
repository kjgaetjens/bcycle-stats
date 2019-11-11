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

// reorg with router if enough time

// Connect to MongoDB
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

        //add code here for the stats...can use similar code to get info

        //API to pull every bus stop with associated nearest bicycle station information
        //This is dependent on a consistent data structure when the API dataset is updated
        //Need to resolve the load issue here...looks like it's timing out before finishing with this many bus stops
        app.get('/bus-stop-info', async (req, res) => {
            db.collection('bicyclestations').createIndex( { geometry: "2dsphere" } )
            
            let nearbyInfo = []
            let results = await db.collection('busstops').find({}).toArray()
            for (let i=0; i<results.length; i++) {
                let nearbyStation = await db.collection('bicyclestations').findOne(
                    {
                        geometry:
                        { $near:
                            {
                                $geometry: results[i].geometry,
                                //update to use url params for variable params
                                $minDistance: 0,
                                $maxDistance: 1000
                            }
                        }
                    }
                )

                if (nearbyStation) {
                    nearbyObject = {
                        ...results[i],
                        nearbyBicycle: {...nearbyStation}
                    }
                    nearbyInfo.push(nearbyObject)
                } else {
                    nearbyObject = {
                        ...results[i],
                        nearbyBicycle: null
                    }
                    nearbyInfo.push(nearbyObject)
                }
            }
                
            res.json({"busStopsNearbyInfo":nearbyInfo})
        })

        //API to pull every rail stop with associated nearest bicycle station information
        //This is dependent on a consistent data structure when the API dataset is updated
        app.get('/rail-stop-info', async (req, res) => {
            db.collection('bicyclestations').createIndex( { geometry: "2dsphere" } )
            
            let nearbyInfo = []
            let results = await db.collection('railstops').find({}).toArray()
            for (let i=0; i<results.length; i++) {
                let nearbyStation = await db.collection('bicyclestations').findOne(
                    {
                        geometry:
                        { $near:
                            {
                                $geometry: results[i].geometry,
                                //update to use url params for variable params
                                $minDistance: 0,
                                $maxDistance: 1000
                            }
                        }
                    }
                )

                if (nearbyStation) {
                    nearbyObject = {
                        ...results[i],
                        nearbyBicycle: {...nearbyStation}
                    }
                    nearbyInfo.push(nearbyObject)
                } else {
                    nearbyObject = {
                        ...results[i],
                        nearbyBicycle: null
                    }
                    nearbyInfo.push(nearbyObject)
                }
            }
                
            res.json({"railStopsNearbyInfo":nearbyInfo})
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