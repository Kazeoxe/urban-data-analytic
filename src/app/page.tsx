"use client"
import styles from "./page.module.css";
import Map from "../components/Map";
import {useEffect, useState} from "react";
import io from 'socket.io-client';

export default function Home() {
    const [earthquakes, setEarthquakes] = useState([]);
    const socket = io();

    useEffect(() => {
        fetch('/api/socket');
    }, []);

    useEffect(() => {
        const handleDataUpdate = (data) => {
            setEarthquakes(data.allEarthquakes || []);
        };

        socket.on("data-update", handleDataUpdate);

        return () => {
            socket.off("data-update", handleDataUpdate);
        };
    }, []);

    console.log(earthquakes);

    return (
    <div className={styles.page}>
     <Map />
    </div>
  );
}
