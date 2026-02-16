import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { Janaza } from '@/types/janaza';
import AuthModal from '@/components/AuthModal';

interface JanazaCardProps {
    janaza: Janaza;
}

export default function JanazaCard({ janaza }: JanazaCardProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [savedDocId, setSavedDocId] = useState<string | null>(null); // Pour pouvoir supprimer
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Vérifier Auth & État "Enregistré"
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                checkIfSaved(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [janaza.id]);

    const checkIfSaved = async (userId: string) => {
        try {
            const q = query(
                collection(db, 'saved_janazas'),
                where('user_id', '==', userId),
                where('janaza_id', '==', janaza.id)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setIsSaved(true);
                setSavedDocId(snapshot.docs[0].id);
            } else {
                setIsSaved(false);
                setSavedDocId(null);
            }
        } catch (err) {
            console.error("Erreur check saved:", err);
        }
    };

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        setLoadingSave(true);
        try {
            if (isSaved && savedDocId) {
                // Supprimer
                await deleteDoc(doc(db, 'saved_janazas', savedDocId));
                setIsSaved(false);
                setSavedDocId(null);
            } else {
                // Ajouter
                const docRef = await addDoc(collection(db, 'saved_janazas'), {
                    user_id: user.uid,
                    janaza_id: janaza.id,
                    saved_at: new Date()
                });
                setIsSaved(true);
                setSavedDocId(docRef.id);
            }
        } catch (err) {
            console.error("Erreur toggle save:", err);
        } finally {
            setLoadingSave(false);
        }
    };

    const openGoogleMaps = () => {
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${janaza.coordonnees.lat},${janaza.coordonnees.lng}`,
            '_blank'
        );
    };

    // --- Logique de formatage de date ---
    let date: Date;
    try {
        if (janaza.heure_priere && typeof janaza.heure_priere.toDate === 'function') {
            date = janaza.heure_priere.toDate();
        } else if (janaza.heure_priere) {
            // Fallback si c'est une string ou un nombre
            date = new Date(janaza.heure_priere as any);
        } else {
            date = new Date(); // Fallback ultime
        }
    } catch (e) {
        console.error("Erreur date Janaza:", e);
        date = new Date();
    }

    const isToday = new Date().toDateString() === date.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
    const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="card-premium h-full flex flex-col p-5 group cursor-pointer hover:border-slate-300 relative bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">

                {/* Header : Bookmark + Date */}
                <div className="flex justify-between items-start mb-3 gap-4">
                    <div className="flex-1 pr-6">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {janaza.nom_defunt}
                        </h3>
                    </div>

                    {/* Bouton Bookmark (Absolu ou Flex) */}
                    <button
                        onClick={handleToggleSave}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-75 ${isSaved
                            ? 'bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                        title={isSaved ? "Retirer des suivis" : "Enregistrer pour plus tard"}
                    >
                        {loadingSave ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill={isSaved ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isSaved ? 'scale-110' : ''}`}
                            >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Date & Heure (Mis en valeur) */}
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${isToday ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isToday ? 'Aujourd\'hui' : isTomorrow ? 'Demain' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>•</span>
                    <span className="text-slate-900 font-bold font-mono">
                        {timeString.slice(0, 5)}
                    </span>
                </div>

                {/* Main Info : Mosquée */}
                <div className="flex-1 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[16px] text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{janaza.nom_mosquee}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{janaza.adresse_mosquee}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-50 mt-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMaps();
                        }}
                        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                        Itinéraire GPS
                    </button>
                </div>
            </div>

            {/* Modale de connexion si besoin */}
            {showAuthModal && <AuthModal user={user} onClose={() => setShowAuthModal(false)} />}
        </>
    );
}
