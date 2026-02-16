'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useState, useEffect } from 'react';

import { Suspense } from 'react';

function BottomNavContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);

    // Charger l'utilisateur pour changer l'icône Profil
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Déterminer la vue active
    const currentView = searchParams.get('view');
    const isMapView = currentView === 'map';
    const isProfilePage = pathname === '/profil';
    const isAjouterPage = pathname === '/ajouter';

    // Ne pas afficher sur certaines pages si besoin (ex: login full screen)
    // if (pathname === '/login') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 px-2 pb-safe md:hidden">

            {/* 1. Liste */}
            <Link
                href="/"
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${pathname === '/' && !isMapView ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={pathname === '/' && !isMapView ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span className="text-[10px] font-semibold">Liste</span>
            </Link>

            {/* 2. Carte */}
            <Link
                href="/?view=map"
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${isMapView ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMapView ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                <span className="text-[10px] font-semibold">Carte</span>
            </Link>

            {/* 3. Soutenir (Cœur) */}
            <Link
                href="/soutenir"
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${pathname === '/soutenir' ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === '/soutenir' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={pathname === '/soutenir' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span className="text-[10px] font-semibold">Soutenir</span>
            </Link>

            {/* 4. Profil / Connexion */}
            <Link
                href="/profil"
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${isProfilePage ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className="relative">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isProfilePage ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {!user && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </div>
                <span className="text-[10px] font-semibold">{user ? 'Compte' : 'Connexion'}</span>
            </Link>

        </nav>
    );
}

export default function BottomNav() {
    return (
        <Suspense fallback={<div className="h-16 bg-white border-t border-slate-200 fixed bottom-0 w-full md:hidden" />}>
            <BottomNavContent />
        </Suspense>
    );
}
