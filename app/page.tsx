'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { Janaza } from '@/types/janaza';
import dynamic from 'next/dynamic';
import JanazaCard from '@/components/JanazaCard';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';

// Charger la carte dynamiquement (côté client uniquement)
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-2xl border border-gray-200">
            <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-gray-500 font-medium">Chargement de la carte...</p>
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

/**
 * Page Principale de l'application Janaza Tracker.
 * Gère l'affichage hybride (Liste/Carte), l'authentification et le chargement des données en temps réel.
 */
export default function Home() {
    // --- États ---
    const [janazas, setJanazas] = useState<Janaza[]>([]); // Liste des prières (réelles + mock)
    const [user, setUser] = useState<User | null>(null); // Utilisateur connecté via Firebase
    const [loading, setLoading] = useState(true); // État de chargement initial
    const [showAuthModal, setShowAuthModal] = useState(false); // Visibilité modale connexion
    const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Mode d'affichage actuel
    const router = useRouter();

    /**
     * Effet de bord : Gestion de l'authentification.
     * Écoute les changements d'état de l'utilisateur (Connexion/Déconnexion).
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    /**
     * Effet de bord : Chargement des données Janaza.
     * S'abonne en temps réel à la collection 'janazas' de Firestore.
     * Combine les données réelles avec les données de démonstration (MOCK_JANAZAS).
     */
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

                // Tri chronologique (plus proche en premier)
                combinedJanazas.sort((a, b) => a.heure_priere.seconds - b.heure_priere.seconds);

                setJanazas(combinedJanazas);
            }, (error) => {
                console.error("Erreur Firestore (fallback mock data):", error);
                setJanazas(MOCK_JANAZAS); // Fallback en cas d'erreur réseau
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Erreur init Firestore", e);
            setJanazas(MOCK_JANAZAS);
        }
    }, []);

    /**
     * Gère l'ouverture de la modale d'ajout.
     * Si l'utilisateur n'est pas connecté, ouvre la modale de connexion à la place.
     */
    const handleAddJanaza = () => {
        if (!user) {
            setShowAuthModal(true);
        } else {
            router.push('/ajouter');
        }
    };

    // Affichage d'un loader pendant l'initialisation de l'auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans mb-16 md:mb-0"> {/* Marge en bas pour la Bottom Nav */}

            {/* Navbar Desktop & Mobile Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo & Navigation */}
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-slate-900 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" /><path d="M14 6.5a1.5 1.5 0 1 1-3 0" /></svg>
                            </div>
                            <h1 className="text-base font-bold tracking-tight text-slate-800">Janaza Tracker</h1>
                        </div>

                        {/* Desktop Toggle Switch (Masqué sur mobile) */}
                        <div className="!hidden md:!flex segmented-control">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                Liste
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`segmented-btn ${viewMode === 'map' ? 'active' : ''}`}
                            >
                                Carte
                            </button>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddJanaza}
                            className="btn-primary"
                        >
                            <span className="hidden sm:inline">Ajouter une prière</span>
                            <span className="sm:hidden">+</span>
                        </button>
                        <button
                            className="px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors hidden md:block" // Caché sur mobile, déplacé en bas ?
                            onClick={() => setShowAuthModal(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col ${viewMode === 'list' ? 'container mx-auto px-4 py-6 md:py-8 max-w-6xl' : 'relative h-[calc(100vh-64px)]'}`}>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300 pb-4">
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

                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-lg z-[1000]">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span>
                                <p className="text-xs font-bold text-slate-900">Île-de-France</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 pb-safe">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex flex-col items-center gap-1 p-2 w-full ${viewMode === 'list' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={viewMode === 'list' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    <span className="text-[10px] font-semibold">Liste</span>
                </button>

                <button
                    onClick={() => setViewMode('map')}
                    className={`flex flex-col items-center gap-1 p-2 w-full ${viewMode === 'map' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={viewMode === 'map' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                    <span className="text-[10px] font-semibold">Carte</span>
                </button>

                <button
                    onClick={() => setShowAuthModal(true)}
                    className={`flex flex-col items-center gap-1 p-2 w-full ${user ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span className="text-[10px] font-semibold">{user ? 'Compte' : 'Connexion'}</span>
                </button>
            </div>

            {/* Modals */}
            {showAuthModal && <AuthModal user={user} onClose={() => setShowAuthModal(false)} />}

        </div>
    );
}
