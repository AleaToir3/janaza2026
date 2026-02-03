'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { JanazaFormData } from '@/types/janaza';
import { useJsApiLoader } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

const LIBRARIES: ("places")[] = ["places"];

export default function AjouterJanazaPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Initialisation Maps
    const { isLoaded: scriptLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    });

    // Etats du formulaire
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<JanazaFormData>({
        nom_defunt: '',
        heure_priere: '',
        nom_mosquee: '',
        adresse_mosquee: '',
        coordonnees: { lat: 48.8566, lng: 2.3522 },
    });

    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Vérifier l'auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setShowAuthModal(true);
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // Initialiser Autocomplete quand le script est prêt
    useEffect(() => {
        if (scriptLoaded && addressInputRef.current && !autocompleteRef.current) {
            const options = {
                fields: ["formatted_address", "geometry", "name"],
                strictBounds: false,
                componentRestrictions: { country: ["fr", "gb"] }, // France et Royaume-Uni
            };

            autocompleteRef.current = new google.maps.places.Autocomplete(
                addressInputRef.current,
                options
            );

            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current?.getPlace();

                if (place && place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.formatted_address || place.name || "";

                    setFormData(prev => ({
                        ...prev,
                        adresse_mosquee: address,
                        coordonnees: { lat, lng }
                    }));
                    setError('');
                }
            });
        }
    }, [scriptLoaded]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setLoading(true);

        try {
            if (!formData.adresse_mosquee) throw new Error("Veuillez choisir une adresse valide.");

            // Création de la Janaza
            await addDoc(collection(db, 'janazas'), {
                nom_defunt: formData.nom_defunt,
                heure_priere: Timestamp.fromDate(new Date(formData.heure_priere)),
                nom_mosquee: formData.nom_mosquee,
                adresse_mosquee: formData.adresse_mosquee,
                coordonnees: formData.coordonnees,
                created_by: user.uid,
                created_at: Timestamp.now(),
            });

            // Redirection vers l'accueil après succès
            router.push('/');
        } catch (err: any) {
            setError(err.message || "Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth) {
        return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    // Si pas connecté, on montre la modale (ou une redirection forcée)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">Connexion requise</h2>
                    <p className="text-slate-500 mb-6">Vous devez être connecté pour ajouter une prière.</p>
                    {showAuthModal && <AuthModal user={user} onClose={() => router.push('/')} />}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 md:py-12 pb-24">
            <div className="max-w-xl mx-auto md:bg-white md:rounded-3xl md:shadow-xl md:border border-slate-100 overflow-hidden">

                {/* Header Page */}
                <div className="px-6 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Nouvelle Prière</h1>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* 1. Identité */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Qui est le défunt ?</label>
                                <input
                                    type="text"
                                    name="nom_defunt"
                                    placeholder="Ex: Mohamed Ali"
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 transition-all font-medium"
                                    required
                                    value={formData.nom_defunt}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Date et Heure de la prière</label>
                                <input
                                    type="datetime-local"
                                    name="heure_priere"
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 transition-all font-medium"
                                    required
                                    value={formData.heure_priere}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* 2. Lieu */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Lieu (Nom simple)</label>
                                <input
                                    type="text"
                                    name="nom_mosquee"
                                    placeholder="Ex: Grande Mosquée de Lyon"
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 transition-all font-medium"
                                    required
                                    value={formData.nom_mosquee}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1.5 relative">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    Adresse exacte
                                    {loadError && <span className="text-xs font-normal text-red-500">Erreur Maps</span>}
                                </label>

                                <div className="relative">
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        name="adresse_mosquee"
                                        placeholder="Adresse, Code Postal ou Nom du lieu..."
                                        className="w-full h-12 px-4 pl-10 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 transition-all font-medium"
                                        required
                                        value={formData.adresse_mosquee}
                                        onChange={handleChange}
                                        disabled={!scriptLoaded}
                                        autoComplete="off"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {scriptLoaded ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                        ) : (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 pl-1">Propulsé par Google Maps</p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-200 hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Publication...' : 'Publier la Janaza'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
