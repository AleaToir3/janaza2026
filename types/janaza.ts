import { Timestamp } from 'firebase/firestore';

export interface Janaza {
    id?: string;
    nom_defunt: string;
    heure_priere: Timestamp;
    nom_mosquee: string;
    adresse_mosquee: string;
    coordonnees: {
        lat: number;
        lng: number;
    };
    created_by: string;
    created_at: Timestamp;
}

export interface JanazaFormData {
    nom_defunt: string;
    heure_priere: string;
    nom_mosquee: string;
    adresse_mosquee: string;
    coordonnees: {
        lat: number;
        lng: number;
    };
}
