"use client";
import styles from "./page.module.css";
import Map from "../components/Map";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import {EarthquakeType} from "@/utils/earthquakeType";

let socket: any; // Connexion socket partagée entre toutes les montées de composants

export default function Home() {
    const [earthquakes, setEarthquakes] = useState<EarthquakeType[]>([]);

    // Initialisation de la connexion socket (une seule fois)
    useEffect(() => {
        if (!socket) {
            socket = io(); // Se connecter au serveur de manière unique
        }

        // Fetch pour initialiser la connexion avec l'API de socket (côté serveur)
        fetch("/api/socket");

        // Fonction pour gérer les mises à jour des données
        const handleDataUpdate = (data: any) => {
            setEarthquakes(data.allEarthquakes || []);
        };

        // Écouter l'événement 'data-update' du serveur
        socket.on("data-update", handleDataUpdate);

        // Nettoyage : désabonnez-vous des mises à jour lorsque le composant est démonté
        return () => {
            socket.off("data-update", handleDataUpdate);
        };
    }, []);

    return (
        <div className={styles.page}>
            <Map earthquakes={earthquakes} />
        </div>
    );
}
