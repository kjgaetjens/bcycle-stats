const express = require('express')
const app = express()
const cors = require('cors')
const mongo = require('mongodb').MongoClient
const axios = require('axios')
require('dotenv').config()

// Middleware
// Don't technically need all of this middleware, but including in case I build out a client app
app.use(cors())
app.use(express.json())
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

        //Delete current MongoDB rail stop and bicycle station data. Pull current rail stop and bicycle station data and add to MonogDB.
        //Should be triggered through interface
        app.post('/refresh-scratch-data', async (req, res) => {
            let railStopResult = await axios('https://opendata.arcgis.com/datasets/c2274084571d4f968cac09a608b868c4_2.geojson')
            await db.collection('scratch-railstops').deleteMany({})
            await db.collection('scratch-railstops').insertMany(railStopResult.data.features)

            let bicycleStationResult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_2.geojson')
            await db.collection('scratch-bicyclestations').deleteMany({})
            await db.collection('scratch-bicyclestations').insertMany(bicycleStationResult.data.features)

            //update
            res.send('success')
        })

        //Should be triggered through interface with regex validation on chars entered
        app.post('/create-collection', async (req, res) => {
            //add validation to check to see if collection name already exists to prevent overwriting
            let collectionName = req.body.name
            if(collectionName){
                let railStopResult = await axios('https://opendata.arcgis.com/datasets/c2274084571d4f968cac09a608b868c4_2.geojson')
                await db.collection(`${collectionName}-railstops`).deleteMany({})
                await db.collection(`${collectionName}-railstops`).insertMany(railStopResult.data.features)
    
                let bicycleStationResult = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_2.geojson')
                await db.collection(`${collectionName}-bicyclestations`).deleteMany({})
                await db.collection(`${collectionName}-bicyclestations`).insertMany(bicycleStationResult.data.features)
            }
            //else return error message

            //update
            res.send('success')
        })

        // API to pull stats on rail stops
        app.get('/rail-stop-stats/:collection/mindistance/:mindistance/maxdistance/:maxdistance', async (req, res) => {
            //add error handling for if collection doesnt exist
            let collection = req.params.collection
            let minDistance = parseInt(req.params.mindistance)
            let maxDistance = parseInt(req.params.maxdistance)

            db.collection(`${collection}-bicyclestations`).createIndex( { geometry: "2dsphere" })
            
            let results = await db.collection(`${collection}-railstops`).find({}).toArray()

            let stopsTotal = results.length
            let stopsWithBicycles = 0
            
            let redStopsTotal = 0
            let redStopsWithBicycles = 0
            let greenStopsTotal = 0
            let greenStopsWithBicycles = 0
            let purpleStopsTotal = 0
            let purpleStopsWithBicycles = 0

            for (let i=0; i<results.length; i++) {
                let nearbyStation = await db.collection(`${collection}-bicyclestations`).findOne(
                    {
                        geometry:
                        { $near:
                            {
                                $geometry: results[i].geometry,
                                $minDistance: minDistance,
                                $maxDistance: maxDistance
                            }
                        }
                    }
                )

                if (nearbyStation) {
                    stopsWithBicycles += 1
                }
                if (results[i].properties.LineColor.includes('Red')) {
                    redStopsTotal += 1
                    if (nearbyStation) {
                        redStopsWithBicycles += 1
                    }
                }
                if (results[i].properties.LineColor.includes('Green')) {
                    greenStopsTotal += 1
                    if (nearbyStation) {
                        greenStopsWithBicycles += 1
                    }
                }
                if (results[i].properties.LineColor.includes('Purple')) {
                    purpleStopsTotal += 1
                    if (nearbyStation) {
                        purpleStopsWithBicycles += 1
                    }
                }

            }
                
            res.json({
                "stopsTotal":stopsTotal,
                "stopsWithBicycles":stopsWithBicycles,
                "percentageWithBicycles":(stopsWithBicycles/stopsTotal)*100,
                "redLine": {
                    "stopsTotal":redStopsTotal,
                    "stopsWithBicycles":redStopsWithBicycles,
                    "percentageWithBicycles":(redStopsWithBicycles/redStopsTotal)*100
                },
                "greenLine": {
                    "stopsTotal":greenStopsTotal,
                    "stopsWithBicycles":greenStopsWithBicycles,
                    "percentageWithBicycles":(greenStopsWithBicycles/greenStopsTotal)*100
                },
                "purpleLine": {
                    "stopsTotal":purpleStopsTotal,
                    "stopsWithBicycles":purpleStopsWithBicycles,
                    "percentageWithBicycles":(purpleStopsWithBicycles/purpleStopsTotal)*100
                }
            })
        })

        //API to pull every rail stop with associated nearest bicycle station information
        //This is dependent on a consistent data structure when the API dataset is updated
        app.get('/rail-stop-info/:collection/mindistance/:mindistance/maxdistance/:maxdistance', async (req, res) => {
            //add error handling for if collection doesnt exist
            let collection = req.params.collection
            let minDistance = parseInt(req.params.mindistance)
            let maxDistance = parseInt(req.params.maxdistance)

            db.collection(`${collection}-bicyclestations`).createIndex( { geometry: "2dsphere" } )

            let nearbyInfo = []
            let results = await db.collection(`${collection}-railstops`).find({}).toArray()
            for (let i=0; i<results.length; i++) {
                let nearbyStation = await db.collection(`${collection}-bicyclestations`).findOne(
                    {
                        geometry:
                        { $near:
                            {
                                $geometry: results[i].geometry,
                                $minDistance: minDistance,
                                $maxDistance: maxDistance
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


app.listen(PORT, () => {
    console.log("Server is running...")
})