'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Janaza } from '@/types/janaza';

interface MapComponentProps {
    janazas: Janaza[];
}

// Styles de la carte pour qu'elle prenne 100% du conteneur
const containerStyle = {
    width: '100%',
    height: '100%'
};

// Position par défaut (Paris) si aucune donnée
const defaultCenter = {
    lat: 48.8566,
    lng: 2.3522
};

// Définir les bibliothèques en dehors du composant pour éviter les re-renders infinis
const LIBRARIES: ("places")[] = ["places"];

export default function MapComponent({ janazas }: MapComponentProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedJanaza, setSelectedJanaza] = useState<Janaza | null>(null);

    // Calculer le centre ou les bornes (bounds) en fonction des marqueurs
    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
        if (janazas.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            janazas.forEach(janaza => {
                if (janaza.coordonnees && janaza.coordonnees.lat) {
                    bounds.extend({ lat: janaza.coordonnees.lat, lng: janaza.coordonnees.lng });
                }
            });
            map.fitBounds(bounds);
        }
    }, [janazas]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    // Mettre à jour les bounds si la liste change
    useEffect(() => {
        if (map && janazas.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            janazas.forEach(janaza => {
                if (janaza.coordonnees && janaza.coordonnees.lat) {
                    bounds.extend({ lat: janaza.coordonnees.lat, lng: janaza.coordonnees.lng });
                }
            });
            map.fitBounds(bounds);
        }
    }, [map, janazas]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-slate-300"></span>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                disableDefaultUI: false, // Garder les contrôles de zoom standard
                zoomControl: true,
                streetViewControl: false, // Désactiver StreetView pour simplifier
                mapTypeControl: false, // Pas de bascule Satellite/Plan pour rester clean
                fullscreenControl: false,
                styles: [ // Style minimaliste gris (optionnel, sinon retirer pour style par défaut Google)
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }] // Masquer les points d'intérêt inutiles
                    }
                ]
            }}
        >
            {janazas.map((janaza) => (
                <Marker
                    key={janaza.id}
                    position={{ lat: janaza.coordonnees.lat, lng: janaza.coordonnees.lng }}
                    onClick={() => setSelectedJanaza(janaza)}
                // On peut ajouter une icône personnalisée ici plus tard si besoin
                />
            ))}

            {selectedJanaza && (
                <InfoWindow
                    position={{ lat: selectedJanaza.coordonnees.lat, lng: selectedJanaza.coordonnees.lng }}
                    onCloseClick={() => setSelectedJanaza(null)}
                >
                    <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{selectedJanaza.nom_defunt}</h3>
                        <p className="text-xs text-slate-500 mb-2">
                            {selectedJanaza.heure_priere.toDate().toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-semibold text-slate-700">{selectedJanaza.nom_mosquee}</p>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedJanaza.coordonnees.lat},${selectedJanaza.coordonnees.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 block font-medium"
                        >
                            Itinéraire →
                        </a>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
