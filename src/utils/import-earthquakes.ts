const { PrismaClient } = require('@prisma/client');
import { earthquakeData } from "./earthquake-data";

const prisma = new PrismaClient();

const saveEarthquakesToDB = async (earthquakes: any) => {
    const newEarthquakes = [];

    for (const earthquake of earthquakes) {
        const {
            id,
            properties: { mag, place, time, updated, detail },
            geometry: { coordinates },
        } = earthquake;

        const [longitude, latitude, depth] = coordinates;

        // Vérifiez si ce séisme existe déjà en base grâce à son ID unique
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
        console.log('Aucun nouveau séisme enregistré');
    }

    return newEarthquakes;
};

const importEarthquakesFromJSON = async () => {
    try {
        console.log(`Importation de ${earthquakeData.features.length} séismes...`);
        await saveEarthquakesToDB(earthquakeData.features);

        console.log('Importation terminée avec succès.');
    } catch (error) {
        console.error('Erreur lors de l’importation des séismes :', error);
    } finally {
        await prisma.$disconnect();
    }
};

// Exécute le script
importEarthquakesFromJSON();
