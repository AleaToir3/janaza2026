'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { Janaza } from '@/types/janaza';
import JanazaCard from '@/components/JanazaCard';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export default function ProfilPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // États Navigation (Tabs)
    const [activeTab, setActiveTab] = useState<'my_posts' | 'saved'>('my_posts');

    // États Données
    const [myPosts, setMyPosts] = useState<Janaza[]>([]);
    const [savedPosts, setSavedPosts] = useState<Janaza[]>([]); // New state
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingSaved, setLoadingSaved] = useState(false); // New loading state

    // 1. Vérification Auth au chargement
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setShowAuthModal(true); // Afficher modale si non connecté
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Charger "Mes Publications"
    useEffect(() => {
        const fetchMyPosts = async () => {
            if (!user) return;
            setLoadingPosts(true);
            try {
                const q = query(
                    collection(db, 'janazas'),
                    where('created_by', '==', user.uid),
                    orderBy('created_at', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const posts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Janaza[];

                setMyPosts(posts);
            } catch (error) {
                console.error("Erreur chargement posts:", error);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (user && activeTab === 'my_posts') {
            fetchMyPosts();
        }
    }, [user, activeTab]);

    // 3. Charger "Mes Suivis" (Nouveau useEffect)
    useEffect(() => {
        const fetchSavedPosts = async () => {
            if (!user) return;
            setLoadingSaved(true);
            try {
                // Étape 1 : Récupérer les IDs des favoris
                const q = query(
                    collection(db, 'saved_janazas'),
                    where('user_id', '==', user.uid),
                    orderBy('saved_at', 'desc')
                );
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setSavedPosts([]);
                    setLoadingSaved(false);
                    return;
                }

                // Étape 2 : Récupérer chaque Janaza correspondante
                const janazaIds = snapshot.docs.map(doc => doc.data().janaza_id);

                // On fait des requêtes parallèles pour charger les détails
                const janazaPromises = janazaIds.map(id => getDoc(doc(db, 'janazas', id)));
                const janazaSnapshots = await Promise.all(janazaPromises);

                const posts = janazaSnapshots
                    .filter(docSnap => docSnap.exists()) // Filtrer les supprimées
                    .map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    })) as Janaza[];

                setSavedPosts(posts);
            } catch (error) {
                console.error("Erreur chargement favoris:", error);
            } finally {
                setLoadingSaved(false);
            }
        };

        if (user && activeTab === 'saved') {
            fetchSavedPosts();
        }
    }, [user, activeTab]);


    // Action Déconnexion
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Erreur déconnexion:", error);
        }
    };

    // --- RENDU ---

    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <span className="loading loading-spinner loading-lg text-slate-300"></span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">Connexion requise</h2>
                    <p className="text-slate-500 mb-6">Connectez-vous pour accéder à votre profil.</p>
                    <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
                        Retour à l'accueil
                    </button>
                    {/* Si on veut forcer la modale ici */}
                    {showAuthModal && <AuthModal user={user} onClose={() => router.push('/')} />}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-24 md:py-12">
            <div className="max-w-4xl mx-auto">

                {/* --- HEADER --- */}
                <div className="bg-white md:rounded-3xl shadow-sm border-b border-slate-100 md:border mb-6">
                    <div className="px-6 py-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">

                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">👤</span>
                            )}
                        </div>

                        {/* Infos Utilisateur */}
                        <div className="flex-1 space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900">{user.displayName || 'Utilisateur'}</h1>
                            <p className="text-slate-500 text-sm">{user.email}</p>
                            <div className="mt-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Membre vérifié
                                </span>
                            </div>
                        </div>

                        {/* Bouton Déconnexion */}
                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm font-semibold flex items-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    {/* --- TABS (Onglets) --- */}
                    <div className="flex px-6 gap-8 border-t border-slate-50 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('my_posts')}
                            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'my_posts'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                            Mes Publications
                            {myPosts.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">{myPosts.length}</span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'saved'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'saved' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            Mes Suivis
                            {savedPosts.length > 0 && (
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'saved' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{savedPosts.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- CONTENU DES ONGLETS --- */}
                <div className="px-4 md:px-0">

                    {/* ONGLET 1: MES PUBLICATIONS */}
                    {activeTab === 'my_posts' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {loadingPosts ? (
                                <div className="flex justify-center p-12">
                                    <span className="loading loading-spinner loading-md text-slate-400"></span>
                                </div>
                            ) : myPosts.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <div className="text-slate-300 mb-3 mx-auto w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
                                    </div>
                                    <h3 className="text-slate-900 font-medium">Aucune publication</h3>
                                    <p className="text-slate-500 text-sm mt-1">Vous n'avez pas encore signalé de Janaza.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myPosts.map((janaza) => (
                                        <div key={janaza.id} className="relative group animate-in fade-in-up duration-300">
                                            <JanazaCard janaza={janaza} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONGLET 2: MES SUIVIS (Implémenté) */}
                    {activeTab === 'saved' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {loadingSaved ? (
                                <div className="flex justify-center p-12">
                                    <span className="loading loading-spinner loading-md text-slate-400"></span>
                                </div>
                            ) : savedPosts.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <div className="text-slate-300 mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-50 rounded-full">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Aucun suivi</h3>
                                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                                        Enregistrez les prières importantes en cliquant sur le bouton <span className="inline-block w-4 h-4 align-middle text-red-500 bg-red-50 rounded-full mx-1"><svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg></span> signet.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedPosts.map((janaza) => (
                                        <div key={janaza.id} className="relative">
                                            <JanazaCard janaza={janaza} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Bouton Retour Mobile (Flottant) */}
            <div className="fixed bottom-24 right-4 md:hidden z-40">
                <button
                    onClick={() => router.push('/')}
                    className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </button>
            </div>
        </main>
    );
}
