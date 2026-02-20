import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Janaza } from '@/types/janaza';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';

interface JanazaCardProps {
    janaza: Janaza;
    /** Optionnel : callback appelé après suppression réussie, pour rafraîchir la liste parente */
    onDeleted?: (id: string) => void;
}

export default function JanazaCard({ janaza, onDeleted }: JanazaCardProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [savedDocId, setSavedDocId] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // État pour la confirmation de suppression
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    // Un seul listener Auth par carte (le contexte global viendra plus tard)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                checkIfSaved(currentUser.uid);
            } else {
                setIsSaved(false);
                setSavedDocId(null);
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
                await deleteDoc(doc(db, 'saved_janazas', savedDocId));
                setIsSaved(false);
                setSavedDocId(null);
            } else {
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

    // --- ACTION MODIFIER ---
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/modifier/${janaza.id}`);
    };

    // --- ACTION SUPPRIMER ---
    const handleDeleteConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!janaza.id) return;
        setLoadingDelete(true);
        try {
            await deleteDoc(doc(db, 'janazas', janaza.id));
            setShowDeleteConfirm(false);
            // On notifie le parent pour rafraîchir la liste
            onDeleted?.(janaza.id);
        } catch (err) {
            console.error("Erreur suppression:", err);
        } finally {
            setLoadingDelete(false);
        }
    };

    const openGoogleMaps = () => {
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${janaza.coordonnees.lat},${janaza.coordonnees.lng}`,
            '_blank'
        );
    };

    // --- Formatage de la date ---
    let date: Date;
    try {
        if (janaza.heure_priere && typeof janaza.heure_priere.toDate === 'function') {
            date = janaza.heure_priere.toDate();
        } else if (janaza.heure_priere) {
            date = new Date(janaza.heure_priere as any);
        } else {
            date = new Date();
        }
    } catch (e) {
        date = new Date();
    }

    const isToday = new Date().toDateString() === date.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
    const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // L'utilisateur est-il le créateur de cette Janaza ?
    const isOwner = user && janaza.created_by && user.uid === janaza.created_by;

    return (
        <>
            <div className="card-premium h-full flex flex-col p-5 group cursor-pointer hover:border-slate-300 relative bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">

                {/* Header : Bookmark + Nom */}
                <div className="flex justify-between items-start mb-3 gap-4">
                    <div className="flex-1 pr-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {janaza.nom_defunt}
                        </h3>
                    </div>

                    {/* Bouton Bookmark */}
                    <button
                        onClick={handleToggleSave}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-75 shrink-0 ${isSaved
                            ? 'bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                        title={isSaved ? "Retirer des suivis" : "Enregistrer pour plus tard"}
                    >
                        {loadingSave ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg
                                width="20" height="20" viewBox="0 0 24 24"
                                fill={isSaved ? "currentColor" : "none"}
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isSaved ? 'scale-110' : ''}`}
                            >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Date & Heure */}
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${isToday ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>•</span>
                    <span className="text-slate-900 font-bold font-mono">
                        {timeString.slice(0, 5)}
                    </span>
                </div>

                {/* Mosquée */}
                <div className="flex-1 mb-4">
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

                {/* Footer : Actions Propriétaire + GPS */}
                <div className="pt-4 border-t border-slate-50 mt-auto space-y-2">
                    {/* Boutons Modifier / Supprimer (seulement pour le créateur) */}
                    {isOwner && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-all active:scale-95"
                                title="Modifier cette Janaza"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Modifier
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                                title="Supprimer cette Janaza"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                Supprimer
                            </button>
                        </div>
                    )}

                    {/* Bouton GPS */}
                    <button
                        onClick={(e) => { e.stopPropagation(); openGoogleMaps(); }}
                        className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                        Itinéraire GPS
                    </button>
                </div>
            </div>

            {/* Modale de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Supprimer la Janaza ?</h3>
                        <p className="text-slate-500 text-sm text-center mb-6">
                            Cette action est irréversible. La prière de <strong>{janaza.nom_defunt}</strong> sera définitivement supprimée.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={loadingDelete}
                                className="flex-1 h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center"
                            >
                                {loadingDelete ? <span className="loading loading-spinner loading-sm" /> : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale de connexion */}
            {showAuthModal && <AuthModal user={user} onClose={() => setShowAuthModal(false)} />}
        </>
    );
}
