'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebaseConfig';
import { useState, useEffect, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

function NavbarContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);


    const isMapView = searchParams.get('view') === 'map';

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo & Brand */}
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <div className="bg-slate-900 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" /><path d="M14 6.5a1.5 1.5 0 1 1-3 0" /></svg>
                    </div>
                    <h1 className="text-base font-bold tracking-tight text-slate-800 hidden sm:block">Janaza Tracker</h1>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/?view=list"
                        className={`text-sm font-medium transition-colors ${pathname === '/' && !isMapView ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Liste
                    </Link>
                    <Link
                        href="/?view=map"
                        className={`text-sm font-medium transition-colors ${isMapView ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Carte
                    </Link>
                    <Link
                        href="/soutenir"
                        className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname === '/soutenir' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={pathname === '/soutenir' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        Nous soutenir
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/ajouter"
                        className="btn-primary flex items-center gap-2"
                    >
                        <span className="hidden sm:inline">Ajouter une prière</span>
                        <span className="sm:hidden">+</span>
                    </Link>

                    {user ? (
                        <Link
                            href="/profil"
                            className={`p-2 rounded-full transition-colors hidden md:block ${pathname === '/profil' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </Link>
                    ) : (
                        <Link
                            href="/profil"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 hidden md:block"
                        >
                            Connexion
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default function Navbar() {
    return (
        <Suspense fallback={<header className="h-16 bg-white/80 border-b border-slate-200 sticky top-0 z-50" />}>
            <NavbarContent />
        </Suspense>
    );
}
