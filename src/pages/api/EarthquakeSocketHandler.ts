import { Server } from 'socket.io';
import axios from 'axios';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UPDATE_INTERVAL = 60000; // 1 minute
const DATABASE_UPDATE_INTERVAL = 15;

const EarthquakeSocketHandler = (req: any, res: any) => {
    if (res.socket.server.io) {
        return res.end();
    }

    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    
    const now = new Date();
    const dateToFetch = new Date(now.getTime() - DATABASE_UPDATE_INTERVAL * 60 * 1000).toISOString();

    const fetchEarthquakeAPI = async () => {
        try {
            const startTime = dateToFetch; // 5 minutes avant
            const endTime = now.toISOString();

            const apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}`;
            const response = await axios.get(apiUrl);

            return response.data.features || [];
        } catch (error) {
            console.error('Erreur lors de l’appel à l’API USGS:', error);
            return [];
        }
    };

    const saveEarthquakesToDB = async (earthquakes: any) => {
        const newEarthquakes = [];

        for (const earthquake of earthquakes) {
            const {
                id: id,
                properties: { mag, place, time, updated, detail },
                geometry: { coordinates },
            } = earthquake;

            const [longitude, latitude, depth] = coordinates;

            // Vérifiez si ce séisme existe déjà en base grâce à son ID unique
            const savedEarthquake = await prisma.earthquake.findUnique({
                where: { apiId: id },
                update: {
                  magnitude: mag,
                  place,
                  time: new Date(time),
                  updated: new Date(updated),
                  detailUrl: detail,
                  coordinates: `${longitude},${latitude},${depth}`,
                },
                create: {
                  apiId: id,
                  magnitude: mag,
                  place,
                  time: new Date(time),
                  updated: new Date(updated),
                  detailUrl: detail,
                  coordinates: `${longitude},${latitude},${depth}`,
                },
              });
        
              newEarthquakes.push(savedEarthquake);
            }
        
            return newEarthquakes;
    };

    io.on('connection', (socket) => {
        console.log('Client connecté');

        const sendUpdate = async () => {
            const earthquakeData = await fetchEarthquakeAPI();
            const newEarthquakes = await saveEarthquakesToDB(earthquakeData);

            console.log("data", earthquakeData);
            console.log("new", newEarthquakes);

            const allEarthquakes = prisma.earthquake.findMany({
                orderBy: {time: 'desc'},
                take: 1000, // Limite raisonnable
            });

            socket.emit('data-update', { newEarthquakes, allEarthquakes });
        };

        sendUpdate(); // Appel initial

        const updateInterval = setInterval(sendUpdate, UPDATE_INTERVAL); // Mise à jour périodique

        socket.on('disconnect', () => {
            clearInterval(updateInterval);
            console.log('Client déconnecté');
        });
    });

    res.end();
};

export default EarthquakeSocketHandler;
