'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Janaza, JanazaFormData } from '@/types/janaza';
import { useJsApiLoader } from '@react-google-maps/api';
import { useRouter, useParams } from 'next/navigation';

const LIBRARIES: ("places")[] = ["places"];

export default function ModifierJanazaPage() {
    const router = useRouter();
    const params = useParams();
    const janazaId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notOwner, setNotOwner] = useState(false);

    const [formData, setFormData] = useState<JanazaFormData>({
        nom_defunt: '',
        heure_priere: '',
        nom_mosquee: '',
        adresse_mosquee: '',
        coordonnees: { lat: 48.8566, lng: 2.3522 },
    });

    const { isLoaded: scriptLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    });

    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // 1. Vérifier l'auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
            if (!currentUser) router.push('/');
        });
        return () => unsubscribe();
    }, []);

    // 2. Charger les données existantes de la Janaza
    useEffect(() => {
        if (!janazaId || loadingAuth) return;

        const fetchJanaza = async () => {
            setLoadingData(true);
            try {
                const docRef = doc(db, 'janazas', janazaId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError("Cette Janaza n'existe pas.");
                    return;
                }

                const data = docSnap.data() as Janaza;

                // Vérifier que l'utilisateur est bien le créateur
                if (user && data.created_by !== user.uid) {
                    setNotOwner(true);
                    return;
                }

                // Pré-remplir le formulaire
                // Convertir le Timestamp Firestore en string datetime-local
                let heureString = '';
                try {
                    const d = data.heure_priere?.toDate();
                    if (d) {
                        // Format YYYY-MM-DDTHH:MM requis par <input type="datetime-local">
                        const offset = d.getTimezoneOffset() * 60000;
                        const localDate = new Date(d.getTime() - offset);
                        heureString = localDate.toISOString().slice(0, 16);
                    }
                } catch { }

                setFormData({
                    nom_defunt: data.nom_defunt,
                    heure_priere: heureString,
                    nom_mosquee: data.nom_mosquee,
                    adresse_mosquee: data.adresse_mosquee,
                    coordonnees: data.coordonnees,
                });
            } catch (err) {
                console.error("Erreur chargement Janaza:", err);
                setError("Impossible de charger cette prière.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchJanaza();
    }, [janazaId, user, loadingAuth]);

    // 3. Google Maps Autocomplete
    useEffect(() => {
        if (scriptLoaded && addressInputRef.current && !autocompleteRef.current) {
            const options = {
                fields: ["formatted_address", "geometry", "name"],
                strictBounds: false,
                componentRestrictions: { country: ["fr", "gb"] },
            };
            autocompleteRef.current = new google.maps.places.Autocomplete(
                addressInputRef.current,
                options
            );
            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                    setFormData(prev => ({
                        ...prev,
                        adresse_mosquee: place.formatted_address || place.name || "",
                        coordonnees: {
                            lat: place.geometry!.location!.lat(),
                            lng: place.geometry!.location!.lng(),
                        }
                    }));
                }
            });
        }
    }, [scriptLoaded, loadingData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !janazaId) return;

        setError('');
        setLoading(true);

        try {
            if (!formData.adresse_mosquee) throw new Error("Veuillez choisir une adresse valide.");

            const docRef = doc(db, 'janazas', janazaId);
            await updateDoc(docRef, {
                nom_defunt: formData.nom_defunt,
                heure_priere: Timestamp.fromDate(new Date(formData.heure_priere)),
                nom_mosquee: formData.nom_mosquee,
                adresse_mosquee: formData.adresse_mosquee,
                coordonnees: formData.coordonnees,
                updated_at: Timestamp.now(),
            });

            // Retour au profil après succès
            router.push('/profil');
        } catch (err: any) {
            setError(err.message || "Erreur lors de la modification.");
        } finally {
            setLoading(false);
        }
    };

    // --- États de chargement ---
    if (loadingAuth || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-slate-300"></span>
            </div>
        );
    }

    if (notOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Accès refusé</h2>
                    <p className="text-slate-500 mb-6">Vous ne pouvez modifier que vos propres publications.</p>
                    <button onClick={() => router.back()} className="text-blue-600 hover:underline font-medium">
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 md:py-12 pb-24">
            <div className="max-w-xl mx-auto md:bg-white md:rounded-3xl md:shadow-xl md:border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-6 border-b border-slate-100 bg-white flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Modifier la prière</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Mettez à jour les informations</p>
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
                                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
