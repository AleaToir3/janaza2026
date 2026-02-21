'use client';

import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Janaza } from '@/types/janaza';
import dynamic from 'next/dynamic';
import JanazaCard from '@/components/JanazaCard';
import { useSearchParams } from 'next/navigation';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-slate-300"></span>
                <p className="text-slate-400 font-medium">Chargement de la carte...</p>
            </div>
        </div>
    ),
});


// --- Formule Haversine : calcule la distance en km entre deux points GPS ---
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- Déterminer la position par défaut selon la langue du navigateur ---
function getDefaultLocation(): { lat: number; lng: number; label: string } {
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'fr-FR';
    if (lang.startsWith('en-GB') || lang.startsWith('en-gb')) {
        return { lat: 51.5074, lng: -0.1278, label: 'Londres (par défaut)' };
    }
    return { lat: 48.8566, lng: 2.3522, label: 'Paris (par défaut)' };
}

type PeriodFilter = 'today' | 'week' | 'all';
type DistanceFilter = 5 | 10 | 25 | null; // null = Tout

interface UserLocation {
    lat: number;
    lng: number;
    label: string;
    isReal: boolean; // true = GPS réel, false = fallback
}

function HomeContent() {
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view') === 'map' ? 'map' : 'list';

    const [janazas, setJanazas] = useState<Janaza[]>([]);

    // --- États Géolocalisation ---
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [geoStatus, setGeoStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');

    // --- États Filtres ---
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
    const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Clé pour re-déclencher l'animation de la liste à chaque changement de filtre
    const [filterKey, setFilterKey] = useState(0);
    const triggerAnimation = () => setFilterKey(k => k + 1);

    // 1. Demander la géolocalisation au chargement
    useEffect(() => {
        setGeoStatus('loading');
        if (!navigator.geolocation) {
            // Navigateur sans GPS → fallback
            const def = getDefaultLocation();
            setUserLocation({ ...def, isReal: false });
            setGeoStatus('denied');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    label: 'Ma position',
                    isReal: true,
                });
                setGeoStatus('granted');
            },
            () => {
                // Refus ou erreur → fallback selon la langue
                const def = getDefaultLocation();
                setUserLocation({ ...def, isReal: false });
                setGeoStatus('denied');
            },
            { timeout: 8000, maximumAge: 300000 }
        );
    }, []);

    // 2. Chargement Firestore (données réelles uniquement)
    useEffect(() => {
        try {
            const now = new Date();
            const q = query(
                collection(db, 'janazas'),
                where('heure_priere', '>=', now),
                orderBy('heure_priere', 'asc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const janazas: Janaza[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Janaza[];
                setJanazas(janazas);
            }, (error) => {
                console.error('Erreur Firestore:', error);
                setJanazas([]);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error('Erreur init Firestore', e);
            setJanazas([]);
        }
    }, []);

    // 3. Appliquer tous les filtres côté client
    const filteredJanazas = janazas.filter((janaza) => {
        // --- Filtre Recherche ---
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchNom = janaza.nom_defunt?.toLowerCase().includes(q);
            const matchMosquee = janaza.nom_mosquee?.toLowerCase().includes(q);
            if (!matchNom && !matchMosquee) return false;
        }
        // --- Filtre Période ---
        if (periodFilter !== 'all') {
            let date: Date;
            try {
                date = janaza.heure_priere?.toDate ? janaza.heure_priere.toDate() : new Date(janaza.heure_priere as any);
            } catch { date = new Date(); }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            if (periodFilter === 'today' && (date < today || date >= tomorrow)) return false;
            if (periodFilter === 'week' && (date < today || date >= nextWeek)) return false;
        }

        // --- Filtre Distance ---
        if (distanceFilter !== null && userLocation) {
            const dist = getDistanceKm(
                userLocation.lat, userLocation.lng,
                janaza.coordonnees.lat, janaza.coordonnees.lng
            );
            if (dist > distanceFilter) return false;
        }

        return true;
    });

    // Tri par distance si un filtre distance est actif
    const sortedJanazas = distanceFilter !== null && userLocation
        ? [...filteredJanazas].sort((a, b) =>
            getDistanceKm(userLocation.lat, userLocation.lng, a.coordonnees.lat, a.coordonnees.lng) -
            getDistanceKm(userLocation.lat, userLocation.lng, b.coordonnees.lat, b.coordonnees.lng)
        )
        : filteredJanazas;

    const hasActiveFilters = periodFilter !== 'all' || distanceFilter !== null || searchQuery.trim() !== '';

    return (
        <main className={`flex-1 flex flex-col min-h-[calc(100vh-64px)] ${viewMode === 'list' ? 'container mx-auto px-4 py-6 md:py-8 max-w-6xl' : 'relative h-[calc(100vh-64px)]'}`}>

            {viewMode === 'list' && (
                <>
                    {/* --- Header --- */}
                    <div className="mb-5 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* --- Barre de Recherche --- */}
                        <div className="relative mb-4">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher un défunt ou une mosquée..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); triggerAnimation(); }}
                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); triggerAnimation(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            )}
                        </div>

                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Prières à venir</h2>
                                <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Consultez les horaires et lieux des prochaines prières.</p>
                            </div>
                            <div className="text-xs font-medium text-slate-400 font-mono hidden sm:block">
                                {sortedJanazas.length} / {janazas.length} PRIÈRES
                            </div>
                        </div>

                        {/* --- Barre de Filtres --- */}
                        <div className="space-y-3">

                            {/* Filtre Période */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide shrink-0">
                                    <svg className="inline mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    Quand
                                </span>
                                {([
                                    { value: 'today', label: "Aujourd'hui" },
                                    { value: 'week', label: 'Cette semaine' },
                                    { value: 'all', label: 'Tout' },
                                ] as { value: PeriodFilter; label: string }[]).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setPeriodFilter(opt.value); triggerAnimation(); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${periodFilter === opt.value
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filtre Distance */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide shrink-0">
                                    <svg className="inline mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" strokeDasharray="3 3" /></svg>
                                    Distance
                                </span>
                                {([
                                    { value: 5, label: '5 km' },
                                    { value: 10, label: '10 km' },
                                    { value: 25, label: '25 km' },
                                    { value: null, label: 'Tout' },
                                ] as { value: DistanceFilter; label: string }[]).map(opt => (
                                    <button
                                        key={String(opt.value)}
                                        onClick={() => { setDistanceFilter(opt.value); triggerAnimation(); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${distanceFilter === opt.value
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}

                                {/* Badge Position */}
                                <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${geoStatus === 'loading'
                                    ? 'bg-slate-50 text-slate-400 border-slate-100'
                                    : userLocation?.isReal
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                    {geoStatus === 'loading' ? (
                                        <><span className="loading loading-spinner loading-xs" /> Localisation...</>
                                    ) : userLocation?.isReal ? (
                                        <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" /> Ma position</>
                                    ) : (
                                        <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> {userLocation?.label}</>
                                    )}
                                </div>
                            </div>

                            {/* Message si filtre actif et 0 résultats */}
                            {hasActiveFilters && sortedJanazas.length === 0 && janazas.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    Aucune prière trouvée avec ces filtres.
                                    <button onClick={() => { setPeriodFilter('all'); setDistanceFilter(null); setSearchQuery(''); triggerAnimation(); }} className="text-slate-900 font-semibold underline underline-offset-2 ml-1">
                                        Tout afficher
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- Grille de cartes --- */}
                    <div
                        key={filterKey}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300 pb-24 md:pb-4"
                    >
                        {sortedJanazas.length === 0 && !hasActiveFilters ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="text-slate-300 mb-3">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                </div>
                                <p className="font-medium text-slate-900">Aucune prière signalée</p>
                                <p className="text-sm text-slate-500 mt-1">Soyez le premier à ajouter une janaza.</p>
                            </div>
                        ) : (
                            sortedJanazas.map((janaza, index) => (
                                <div key={janaza.id} className="fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <JanazaCard janaza={janaza} />
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* MAP VIEW */}
            {viewMode === 'map' && (
                <div className="absolute inset-0 w-full h-full bg-slate-100">
                    <MapComponent janazas={sortedJanazas} />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-lg z-[1000] hidden md:block">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-900">{sortedJanazas.length} Prières actives</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>}>
            <HomeContent />
        </Suspense>
    );
}
