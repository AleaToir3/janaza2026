'use client';

import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Janaza } from '@/types/janaza';
import dynamic from 'next/dynamic';
import JanazaCard from '@/components/JanazaCard';
import { useSearchParams } from 'next/navigation';

// Charger la carte dynamiquement (côté client uniquement)
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

// Données de démonstration (Mock Data)
const MOCK_JANAZAS: Janaza[] = [
    {
        id: 'mock1',
        nom_defunt: 'Amine Ben Ahmed',
        heure_priere: Timestamp.fromDate(new Date(Date.now() + 3600000 * 2)), // Dans 2h
        nom_mosquee: 'Grande Mosquée de Paris',
        adresse_mosquee: "2bis Place du Puits de l'Ermite, 75005 Paris",
        coordonnees: { lat: 48.8421, lng: 2.3556 },
        created_by: 'system',
        created_at: Timestamp.now(),
    },
    {
        id: 'mock2',
        nom_defunt: 'Fatima Zahra',
        heure_priere: Timestamp.fromDate(new Date(Date.now() + 3600000 * 5)), // Dans 5h
        nom_mosquee: 'Mosquée de Gennevilliers',
        adresse_mosquee: '18 Rue Paul Vaillant Couturier, 92230 Gennevilliers',
        coordonnees: { lat: 48.9284, lng: 2.2989 },
        created_by: 'system',
        created_at: Timestamp.now(),
    },
    {
        id: 'mock3',
        nom_defunt: 'Ibrahim Diallo',
        heure_priere: Timestamp.fromDate(new Date(Date.now() + 3600000 * 24)), // Demain
        nom_mosquee: 'Mosquée de Créteil',
        adresse_mosquee: '4 Rue Jean Gabin, 94000 Créteil',
        coordonnees: { lat: 48.7758, lng: 2.4578 },
        created_by: 'system',
        created_at: Timestamp.now(),
    },
];

function HomeContent() {
    const searchParams = useSearchParams();
    const [janazas, setJanazas] = useState<Janaza[]>([]);

    // Déterminer le mode d'affichage via l'URL (par défaut 'list')
    const viewMode = searchParams.get('view') === 'map' ? 'map' : 'list';

    // Chargement des données Firestore
    useEffect(() => {
        try {
            const q = query(collection(db, 'janazas'), where('heure_priere', '>=', Timestamp.now()), orderBy('heure_priere', 'asc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const realJanazas: Janaza[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Janaza[];

                // Fusion : Données réelles + Données Mock (filtrées pour le futur)
                const now = Date.now();
                const futureMocks = MOCK_JANAZAS.filter(j => j.heure_priere.toMillis() >= now);
                const combinedJanazas = [...realJanazas, ...futureMocks];

                // Tri chronologique
                combinedJanazas.sort((a, b) => a.heure_priere.seconds - b.heure_priere.seconds);

                setJanazas(combinedJanazas);
            }, (error) => {
                console.error("Erreur Firestore:", error);
                setJanazas(MOCK_JANAZAS);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Erreur init Firestore", e);
            setJanazas(MOCK_JANAZAS);
        }
    }, []);

    return (
        <main className={`flex-1 flex flex-col min-h-[calc(100vh-64px)] ${viewMode === 'list' ? 'container mx-auto px-4 py-6 md:py-8 max-w-6xl' : 'relative h-[calc(100vh-64px)]'}`}>

            {/* Header de section (Uniquement en mode Liste) */}
            {viewMode === 'list' && (
                <div className="mb-6 md:mb-8 flex items-end justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Prières à venir</h2>
                        <p className="text-sm text-slate-500 mt-1">Consultez les horaires et lieux des prochaines prières.</p>
                    </div>
                    <div className="text-xs font-medium text-slate-400 font-mono hidden sm:block">
                        {janazas.length} PRIÈRES
                    </div>
                </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300 pb-24 md:pb-4">
                    {janazas.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="text-slate-300 mb-3">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <p className="font-medium text-slate-900">Aucune prière signalée</p>
                            <p className="text-sm text-slate-500 mt-1">Soyez le premier à ajouter une janaza.</p>
                        </div>
                    ) : (
                        janazas.map((janaza, index) => (
                            <div key={janaza.id} className="fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <JanazaCard janaza={janaza} />
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MAP VIEW - Full Screen */}
            {viewMode === 'map' && (
                <div className="absolute inset-0 w-full h-full bg-slate-100">
                    <MapComponent janazas={janazas} />

                    {/* Petit badge overlay */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-lg z-[1000] hidden md:block">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-900">{janazas.length} Prières actives</p>
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
