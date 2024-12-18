"use client";
import { useEffect, useState } from "react";
import gsap from "gsap";

export default function Loader() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    function startloader() {
      const counter = document.querySelector(".counter");
      
      let currentValue = 0;

      function updateCounter() {
        if (currentValue < 100) {
          currentValue += Math.floor(Math.random() * 10) + 1;
        }

        if (currentValue > 100) {
          currentValue = 100;
        }

        if (counter) {
          counter.textContent = currentValue.toString();
        }

        if (currentValue < 100) {
          const delay = Math.floor(Math.random() * 200) + 50;
          setTimeout(updateCounter, delay);
        }
      }

      updateCounter();
    }

    if (isMounted) {
      startloader();

      // Animation du compteur
      gsap.to(".counter", {
        opacity: 0,
        duration: 0.25,
        delay: 3.5,
        onComplete: () => {
          // Cache le compteur après la fin de l'animation
          document.querySelector(".counter")?.parentElement?.style.setProperty("display", "none");
        }
      });

      // Animation des barres
      gsap.to(".bar", {
        height: 0,
        duration: 1.5,
        delay: 3.5,
        stagger: {
          amount: 0.5
        },
        ease: "power4.inOut",
        onComplete: () => {
          // Cache l'overlay après la fin de l'animation
          (document.querySelector(".overlay") as HTMLElement)?.style.setProperty("display", "none");
        }
      });

      // Animation du contenu principal
      gsap.from("main", {
        y: 400,
        duration: 2,
        delay: 4,
        ease: "power4.inOut"
      });
    }
  }, [isMounted]);

  if (!isMounted) return null;
  return null;
}