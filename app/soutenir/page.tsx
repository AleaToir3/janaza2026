'use client';

import Link from 'next/link';

export default function SoutenirPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 md:px-0">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header Visuel */}
                <div className="bg-slate-900 px-6 py-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cube-coat.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                            <span className="text-3xl">🤝</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Soutenir le Projet</h1>
                        <p className="text-slate-300 text-sm">Contribuez à la maintenance de Janaza Tracker</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">

                    {/* Message Explicatif */}
                    <div className="text-center space-y-4">
                        <p className="text-slate-600 leading-relaxed">
                            <strong className="text-slate-900 block mb-2">BarakAllahu Fikum pour votre soutien.</strong>
                            Cette application est développée bénévolement pour servir la communauté. Vos dons nous aident à payer les serveurs, les services de cartographie et à continuer d'améliorer l'outil pour tous.
                        </p>
                    </div>

                    <div className="border-t border-slate-100 my-6"></div>

                    {/* Section Revolut */}
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Moyen de paiement sécurisé</h3>

                            {/* Bouton Revolut */}
                            <a
                                href="https://revolut.me/abdeldjalllil159"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group w-full flex items-center justify-center gap-3 bg-[#196CFA] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#145bce] transition-all shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
                            >
                                <span className="font-sans">R</span>
                                <span>Faire un don via Revolut</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </a>
                            <p className="text-xs text-slate-400 mt-2">Rapide, sécurisé et sans frais.</p>
                        </div>

                        {/* Section QR Code */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
                            <p className="text-sm font-semibold text-slate-700 mb-4">Ou scannez ce QR Code avec votre appli :</p>

                            {/* Placeholder QR Code */}
                            <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm mb-2 flex items-center justify-center">
                                {/* IMAGE DU QR CODE - À PLACER DANS public/qrcode.png */}
                                <img
                                    src="/qrcode.png"
                                    alt="QR Code Revolut"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        // Fallback si l'image n'existe pas encore
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="text-xs text-slate-400 p-4">Ajoutez votre fichier <strong>qrcode.png</strong> dans le dossier public/</div>';
                                    }}
                                />
                            </div>
                            <p className="text-xs font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">@abdeldjalllil159</p>
                        </div>
                    </div>

                </div>

                {/* Footer simple */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center">
                    <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </main>
    );
}
