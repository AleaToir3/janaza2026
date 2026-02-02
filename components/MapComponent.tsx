'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Janaza } from '@/types/janaza';

// Création d'une icône CSS pure "Uber-like"
// Création d'une icône CSS pure "Uber-like"
// Utilise L.divIcon pour éviter les problèmes d'images et permettre un styling CSS complet
const createCustomIcon = () => {
    return L.divIcon({
        className: 'custom-marker-container',
        html: '<div class="custom-marker-pin"></div>', // Défini dans main.css
        iconSize: [24, 24],
        iconAnchor: [12, 12], // Centré
        popupAnchor: [0, -12], // Popup juste au-dessus
    });
};

interface MapComponentProps {
    janazas: Janaza[];
    center?: [number, number];
    zoom?: number;
}

/**
 * Composant utilitaire (invisible) pour recentrer la carte
 * quand la liste des janazas change.
 */
function MapUpdater({ janazas }: { janazas: Janaza[] }) {
    const map = useMap();

    useEffect(() => {
        if (janazas.length > 0) {
            // Créer une "bounding box" qui contient tous les points
            const bounds = L.latLngBounds(
                janazas.map(j => [j.coordonnees.lat, j.coordonnees.lng])
            );
            // Ajuster la vue pour inclure tous les marqueurs avec un padding
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        }
    }, [janazas, map]);

    return null;
}

/**
 * Carte Interactive Leaflet.
 * Affiche les prières sous forme de marqueurs sur un fond de carte CartoDB.
 */
export default function MapComponent({
    janazas,
    center = [48.8566, 2.3522], // Paris par défaut
    zoom = 12
}: MapComponentProps) {

    const openGoogleMaps = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    const customIcon = createCustomIcon();

    return (
        <div className="h-full w-full bg-[#f8f9fa] relative z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0 outline-none"
                zoomControl={false} // On va le mettre ailleurs ou custom
            >
                {/* Tuiles CartoDB Positron : Ultra clean, gris clair */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {janazas.length > 0 && <MapUpdater janazas={janazas} />}

                {janazas.map((janaza) => (
                    <Marker
                        key={janaza.id}
                        position={[janaza.coordonnees.lat, janaza.coordonnees.lng]}
                        icon={customIcon}
                    >
                        <Popup className="premium-popup">
                            <div className="p-3 min-w-[200px] font-sans">
                                {/* Header Popup */}
                                <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prière</span>
                                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {janaza.heure_priere.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <h3 className="font-bold text-sm text-slate-900 mb-1 leading-tight">{janaza.nom_defunt}</h3>

                                <div className="flex items-start gap-1.5 mt-2 mb-3">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    <p className="text-xs text-slate-600 line-clamp-2">{janaza.nom_mosquee}</p>
                                </div>

                                <button
                                    onClick={() => openGoogleMaps(janaza.coordonnees.lat, janaza.coordonnees.lng)}
                                    className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-md transition-colors flex items-center justify-center gap-1"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                    Itinéraire
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

