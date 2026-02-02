'use client';

import { Janaza } from '@/types/janaza';

interface JanazaCardProps {
    janaza: Janaza; // Objet contenant les infos de la prière funéraire
}

/**
 * Composant Carte pour afficher les détails d'une Janaza.
 * Présente le nom, la date, la mosquée et un bouton d'itinéraire.
 * Formatage intelligent de la date (Aujourd'hui, Demain...)
 */
export default function JanazaCard({ janaza }: JanazaCardProps) {
    /**
     * Ouvre Google Maps dans un nouvel onglet avec l'itinéraire vers la mosquée.
     */
    const openGoogleMaps = () => {
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${janaza.coordonnees.lat},${janaza.coordonnees.lng}`,
            '_blank'
        );
    };

    // --- Logique de formatage de date ---
    const date = janaza.heure_priere.toDate();
    const isToday = new Date().toDateString() === date.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();

    const dayString = isToday ? "Aujourd'hui" : isTomorrow ? "Demain" : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="card-premium h-full flex flex-col p-6 group cursor-pointer hover:border-slate-300">

            {/* Header : Nom (Gauche) & Date/Heure (Droite) */}
            <div className="flex justify-between items-start mb-4 gap-4">
                {/* Nom du Défunt (Zone principale) */}
                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {janaza.nom_defunt}
                </h3>

                {/* Bloc Date & Heure (Aligné à droite) */}
                <div className="flex flex-col items-end shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-slate-900 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 mb-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="text-sm font-bold font-mono tracking-tight">{timeString.slice(0, 5)}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-green-600' : 'text-slate-400'}`}>
                        {isToday ? 'Aujourd\'hui' : dayString}
                    </span>
                </div>
            </div>

            {/* Main Info : Mosquée */}
            <div className="flex-1 mb-6">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 min-w-[16px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">{janaza.nom_mosquee}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{janaza.adresse_mosquee}</p>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMaps();
                    }}
                    className="w-full btn-secondary text-xs group-hover:border-indigo-200 group-hover:bg-indigo-50/50 group-hover:text-indigo-700 transition-all font-semibold"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                    Obtenir l'itinéraire
                </button>
            </div>
        </div>
    );
}
