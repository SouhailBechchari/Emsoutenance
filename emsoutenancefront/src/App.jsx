"use client";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import RoleCards from "./components/RoleCards";
import Footer from "./components/Footer";

/**
 * Composant App (Page d'accueil)
 * 
 * C'est la page principale qui s'affiche quand on arrive sur le site (la racine "/").
 * Elle est composée de plusieurs "blocs" (Composants) empilés les uns sur les autres.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      {/* Barre de navigation en haut */}
      <Navbar />

      <div className="animate-fade-in-up">
        {/* Section Héro : C'est la grande bannière en haut */}
        <Hero />

        {/* Section Fonctionnalités : Liste de ce qu'on peut faire */}
        <Features />

        {/* Section Rôles : Les cartes pour choisir si on est étudiant, prof, etc. */}
        <RoleCards />
      </div>

      {/* Pied de page en bas */}
      <Footer />
    </div>
  );
}
