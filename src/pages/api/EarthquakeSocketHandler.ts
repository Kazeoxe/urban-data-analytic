import { Server } from "socket.io";
import axios from "axios";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UPDATE_INTERVAL = 20000; // 60 secondes
const DATABASE_UPDATE_INTERVAL = 5; // 5 minutes
const LIMIT_TO_RETURN = 1;

let globalUpdateInterval: any = null;
let connectedClients = 0;
let lastFetchedData: any = null;

const fetchEarthquakeAPI = async () => {
  try {
    const now = new Date();
    const dateToFetch = new Date(
        now.getTime() - DATABASE_UPDATE_INTERVAL * 60 * 1000
    ).toISOString();

    const apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${dateToFetch}&endtime=${now.toISOString()}`;
    const response = await axios.get(apiUrl);

    return response.data.features || [];
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API USGS:", error);
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

    const existingEarthquake = await prisma.earthquake.findUnique({
      where: { apiId: id },
    });

    if (!existingEarthquake) {
      const newEarthquake = await prisma.earthquake.create({
        data: {
          apiId: id,
          magnitude: mag,
          place,
          time: new Date(time),
          updated: new Date(updated),
          detailUrl: detail,
          coordinates: `${longitude},${latitude},${depth}`,
        },
      });
      newEarthquakes.push(newEarthquake);
    }
  }

  if (newEarthquakes.length > 0) {
    console.log(`Enregistré ${newEarthquakes.length} nouveaux séismes`);
  } else {
    console.log("Aucun nouveau séisme enregistré");
  }

  return newEarthquakes;
};

const updateData = async (io: Server) => {
  try {
    const earthquakeData = await fetchEarthquakeAPI();
    await saveEarthquakesToDB(earthquakeData);

    const allEarthquakes = await prisma.earthquake.findMany({
      orderBy: { time: "desc" },
      take: LIMIT_TO_RETURN,
    });

    lastFetchedData = { allEarthquakes };
    io.emit("data-update", lastFetchedData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des données:", error);
  }
};

const EarthquakeSocketHandler = (req: any, res: any) => {
  if (res.socket.server.io) {
    return res.end();
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    connectedClients++;
    console.log(`Client connecté (total: ${connectedClients})`);

    // Envoyer les dernières données immédiatement si disponibles
    if (lastFetchedData) {
      socket.emit("data-update", lastFetchedData);
    }

    // Démarrer l'intervalle global si c'est le premier client
    if (connectedClients === 1) {
      updateData(io); // Première mise à jour
      globalUpdateInterval = setInterval(() => updateData(io), UPDATE_INTERVAL);
      console.log("Démarrage de l'intervalle de mise à jour global");
    }

    socket.on("disconnect", () => {
      connectedClients--;
      console.log(`Client déconnecté (reste: ${connectedClients})`);

      // Arrêter l'intervalle global si plus aucun client
      if (connectedClients === 0 && globalUpdateInterval) {
        clearInterval(globalUpdateInterval);
        globalUpdateInterval = null;
        lastFetchedData = null;
        console.log("Arrêt de l'intervalle de mise à jour global");
      }
    });
  });

  res.end();
};

export default EarthquakeSocketHandler;
