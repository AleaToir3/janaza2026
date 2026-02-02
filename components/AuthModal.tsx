'use client';

import { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { User } from 'firebase/auth';

interface AuthModalProps {
    user: User | null; // Utilisateur actuel (pour afficher le profil si connecté)
    onClose: () => void; // Fonction de fermeture de la modale
}

/**
 * Modale d'Authentification / Gestion de Profil.
 * - Si USER connecté : Affiche les infos du profil et le bouton déconnexion.
 * - Si USER déconnecté : Affiche le formulaire Login / Register.
 * 
 * Responsive : Full Screen sur Mobile, Centrée sur Desktop.
 */
export default function AuthModal({ user, onClose }: AuthModalProps) {
    // États du formulaire
    const [isLogin, setIsLogin] = useState(true); // true = Connexion, false = Inscription
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err: any) {
            setError(
                err.code === 'auth/invalid-credential'
                    ? 'Email ou mot de passe incorrect'
                    : err.code === 'auth/email-already-in-use'
                        ? 'Cet email est déjà utilisé'
                        : err.code === 'auth/weak-password'
                            ? 'Le mot de passe doit contenir au moins 6 caractères'
                            : 'Une erreur est survenue'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            onClose();
        } catch (err) {
            setError('Erreur lors de la déconnexion');
        }
    };

    // --- RENDER : MODAL OVERLAY ---
    const modalContent = (
        <div className="fixed inset-0 z-[2000] md:flex md:items-center md:justify-center">

            {/* Backdrop (Darken on Desktop only) */}
            <div
                className="absolute inset-0 bg-white md:bg-slate-900/60 md:backdrop-blur-sm transition-all"
                onClick={onClose}
            ></div>

            {/* Modal Box (Full Screen Mobile / Centered Desktop) */}
            <div className="relative w-full h-full md:h-auto md:max-w-[440px] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button (Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 flex flex-col justify-center">

                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
                            <span className="text-3xl">🕌</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                            {user ? 'Mon Profil' : (isLogin ? 'Bon retour' : 'Rejoindre la communauté')}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm">
                            {user ? 'Gérez vos informations et préférences' : 'Suivez les prières funéraires en temps réel près de chez vous.'}
                        </p>
                    </div>

                    {user ? (
                        /* --- LOGGED IN STATE --- */
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl mb-4 text-slate-300">
                                    👤
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Compte Actif</p>
                                <p className="font-bold text-lg text-slate-900 break-all">{user.email}</p>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="group w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white border border-red-100 text-red-600 font-semibold hover:bg-red-50 hover:border-red-200 transition-all hover:shadow-sm"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Se déconnecter
                            </button>
                        </div>
                    ) : (
                        /* --- AUTH FORM --- */
                        <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    <input
                                        type="email"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border-0 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Mot de passe</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border-0 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium tracking-wide"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-start gap-3 animate-in shake duration-300">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold text-base shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="loading loading-spinner loading-sm text-white/80"></span>
                                        <span>Traitement...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Se connecter' : "Créer mon compte"}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </>
                                )}
                            </button>

                            {/* Switch Mode */}
                            <div className="pt-6 mt-4 border-t border-slate-100 text-center">
                                <p className="text-slate-500 text-sm font-medium mb-3">
                                    {isLogin ? "Nouveau sur Janaza Tracker ?" : "Vous avez déjà un compte ?"}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-slate-900 font-bold hover:text-indigo-600 transition-colors text-sm hover:underline underline-offset-4 decoration-2"
                                >
                                    {isLogin ? "Créer un compte gratuitement" : "Connectez-vous ici"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );

    return modalContent;
}
