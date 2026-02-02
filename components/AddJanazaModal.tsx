'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { User } from 'firebase/auth';
import { JanazaFormData } from '@/types/janaza';

interface AddJanazaModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddJanazaModal({ user, onClose, onSuccess }: AddJanazaModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<JanazaFormData>({
        nom_defunt: '',
        heure_priere: '',
        nom_mosquee: '',
        adresse_mosquee: '',
        coordonnees: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCoordChange = (field: 'lat' | 'lng', value: string) => {
        setFormData(prev => ({
            ...prev,
            coordonnees: {
                ...prev.coordonnees,
                [field]: parseFloat(value) || 0,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const janazaData = {
                nom_defunt: formData.nom_defunt,
                heure_priere: Timestamp.fromDate(new Date(formData.heure_priere)),
                nom_mosquee: formData.nom_mosquee,
                adresse_mosquee: formData.adresse_mosquee,
                coordonnees: formData.coordonnees,
                created_by: user.uid,
                created_at: Timestamp.now(),
            };

            await addDoc(collection(db, 'janazas'), janazaData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError('Erreur lors de l\'ajout : ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const geocodeAddress = async () => {
        if (!formData.adresse_mosquee) {
            setError('Veuillez entrer une adresse');
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    formData.adresse_mosquee
                )}`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    coordonnees: {
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon),
                    },
                }));
                setError('');
            } else {
                setError('Adresse introuvable. Essayez de préciser la ville.');
            }
        } catch (err) {
            setError('Service de géolocalisation indisponible.');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] md:flex md:items-center md:justify-center">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-white md:bg-slate-900/60 md:backdrop-blur-sm transition-all"
                onClick={onClose}
            ></div>

            {/* Modal Box */}
            <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button & Header Mobile */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2 md:hidden">
                    <h3 className="text-xl font-bold text-slate-900">Nouvelle Prière</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-900"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Close Button Desktop */}
                <button
                    onClick={onClose}
                    className="hidden md:block absolute top-6 right-6 z-10 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2 md:p-10">

                    {/* Header Desktop */}
                    <div className="hidden md:block mb-8">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                            📍
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Ajouter une Janaza</h3>
                        <p className="text-slate-500 mt-1">Partagez les informations pour permettre à la communauté de participer.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Section 1: Défunt & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Nom du défunt</label>
                                <input
                                    type="text"
                                    name="nom_defunt"
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-0 text-slate-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium"
                                    placeholder="Ex: Mohamed Ali"
                                    value={formData.nom_defunt}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Heure de la prière</label>
                                <input
                                    type="datetime-local"
                                    name="heure_priere"
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-0 text-slate-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium"
                                    value={formData.heure_priere}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Section 2: Mosquée */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Lieu (Mosquée)</label>
                            <input
                                type="text"
                                name="nom_mosquee"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-0 text-slate-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium"
                                placeholder="Nom de la mosquée"
                                value={formData.nom_mosquee}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Section 3: Adresse et Geo */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Adresse complète</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="adresse_mosquee"
                                    required
                                    className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border-0 text-slate-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all font-medium"
                                    placeholder="10 rue de la Paix, 75000 Paris"
                                    value={formData.adresse_mosquee}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={geocodeAddress}
                                    className="h-12 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                                    <span className="hidden sm:inline">Géolocaliser</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">Cliquez sur géolocaliser pour remplir les coordonnées automatiquement.</p>
                        </div>

                        {/* Coordonnées (Cachées ou discrètes pour debug/expert) */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Coordonnées GPS</label>
                                <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-1 rounded border border-slate-100">Auto-rempli</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 ml-1">Latitude</span>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm font-mono text-slate-600 focus:border-slate-900 focus:ring-0 transition-all"
                                        value={formData.coordonnees.lat}
                                        onChange={(e) => handleCoordChange('lat', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 ml-1">Longitude</span>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm font-mono text-slate-600 focus:border-slate-900 focus:ring-0 transition-all"
                                        value={formData.coordonnees.lng}
                                        onChange={(e) => handleCoordChange('lng', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-3 animate-pulse">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-col-reverse md:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-12 md:flex-1 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 md:h-12 md:flex-[2] bg-slate-900 text-white rounded-xl font-bold text-base shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm text-white/80"></span>
                                        <span>Publication...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Publier la prière</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
