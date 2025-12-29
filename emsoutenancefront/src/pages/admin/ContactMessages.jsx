import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../services/api";

/**
 * Gestion des Messages de Contact
 * 
 * Permet à l'administrateur de :
 * - Consulter les messages envoyés depuis le formulaire de contact public.
 * - Marquer les messages comme lus/non lus.
 * - Supprimer les messages obsolètes.
 * - Répondre via le lien `mailto`.
 */
export default function ContactMessages() {
    const { user } = useAuth();

    // --- STATES ---
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Stats rapides
    const [stats, setStats] = useState({ total: 0, unread: 0 });

    // Filtre actuel (all, read, unread)
    const [filter, setFilter] = useState('all');

    // --- LIFECYCLE ---
    useEffect(() => {
        fetchMessages();
    }, []);

    // --- API CALLS ---
    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/contact-messages');
            const msgs = response.data.data || [];

            setMessages(msgs);

            // Calcul des stats
            // Si l'API renvoie déjà les totaux, les utiliser, sinon les calculer
            setStats({
                total: response.data.total || msgs.length,
                unread: response.data.unread || msgs.filter(m => !m.is_read).length
            });
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.post(`/admin/contact-messages/${id}/mark-read`);
            // Mise à jour locale optimiste
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
            setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

            if (selectedMessage?.id === id) {
                setSelectedMessage(prev => ({ ...prev, is_read: true }));
            }
        } catch (error) {
            console.error('Erreur mark-read:', error);
        }
    };

    const handleMarkAsUnread = async (id) => {
        try {
            await api.post(`/admin/contact-messages/${id}/mark-unread`);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: false } : m));
            setStats(prev => ({ ...prev, unread: prev.unread + 1 }));

            if (selectedMessage?.id === id) {
                setSelectedMessage(prev => ({ ...prev, is_read: false }));
            }
        } catch (error) {
            console.error('Erreur mark-unread:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

        try {
            await api.delete(`/admin/contact-messages/${id}`);
            setMessages(prev => prev.filter(m => m.id !== id));
            setSelectedMessage(null);
            // Recalcul simple des stats
            const isRead = messages.find(m => m.id === id)?.is_read;
            setStats(prev => ({
                total: prev.total - 1,
                unread: !isRead ? prev.unread - 1 : prev.unread
            }));
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Impossible de supprimer le message.');
        }
    };

    // --- LOGIQUE METIER ---

    // Sélection d'un message (marque comme lu auto)
    const handleViewMessage = async (message) => {
        setSelectedMessage(message);
        if (!message.is_read) {
            await handleMarkAsRead(message.id);
        }
    };

    // Filtrage local
    const filteredMessages = messages.filter(msg => {
        if (filter === 'read') return msg.is_read;
        if (filter === 'unread') return !msg.is_read;
        return true;
    });

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
            <Navbar />
            <AdminSidebar />

            <main className="md:ml-64 pt-4 pb-8 px-4 sm:px-6 lg:px-8">

                {/* En-tête avec Stats */}
                <div className="bg-gradient-to-r from-yellow-900 to-orange-800 rounded-lg p-6 mb-8 shadow-xl border-l-4 border-yellow-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-white">Messagerie</h1>
                            <p className="text-yellow-200 text-sm">Gestion des messages de contact reçus</p>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div className="bg-black/30 p-3 rounded-lg min-w-[100px]">
                                <span className="block text-2xl font-bold text-white">{stats.total}</span>
                                <span className="text-xs text-gray-300 uppercase">Total</span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg min-w-[100px]">
                                <span className="block text-2xl font-bold text-yellow-400">{stats.unread}</span>
                                <span className="text-xs text-gray-300 uppercase">Non lus</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtres Rapides */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'all', label: 'Tous' },
                        { key: 'unread', label: 'Non lus' },
                        { key: 'read', label: 'Archives' }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-320px)] min-h-[500px]">

                    {/* Colonne Gauche : Liste des messages */}
                    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col border border-gray-700">
                        <div className="p-4 bg-gray-750 border-b border-gray-700">
                            <h2 className="text-lg font-bold text-gray-200">Boîte de réception</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-10 text-gray-500">Chargement...</div>
                            ) : filteredMessages.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 italic">Aucun message dans cette vue.</div>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => handleViewMessage(msg)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all border-l-4 ${selectedMessage?.id === msg.id
                                                ? 'bg-blue-900/30 border-blue-500'
                                                : msg.is_read
                                                    ? 'bg-gray-700/30 border-transparent hover:bg-gray-700'
                                                    : 'bg-gray-700 border-yellow-500 hover:bg-gray-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-semibold ${!msg.is_read ? 'text-white' : 'text-gray-400'}`}>
                                                {msg.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 mb-1 truncate">{msg.subject}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2">{msg.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Colonne Droite : Lecture Message */}
                    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col">
                        {selectedMessage ? (
                            <>
                                {/* Header Message */}
                                <div className="p-6 border-b border-gray-700 bg-gray-750 rounded-t-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">{selectedMessage.subject}</h2>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>De: <span className="text-white">{selectedMessage.name}</span></span>
                                                <span>&lt;{selectedMessage.email}&gt;</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 block">
                                                {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                                            </span>
                                            <div className="mt-2 space-x-2">
                                                {selectedMessage.is_read ? (
                                                    <button onClick={() => handleMarkAsUnread(selectedMessage.id)} className="text-xs text-yellow-400 hover:underline">Marquer non lu</button>
                                                ) : (
                                                    <span className="text-xs text-green-400">Nouveau</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Corps Message */}
                                <div className="p-6 flex-1 overflow-y-auto bg-gray-800 text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedMessage.message}
                                </div>

                                {/* Actions Footer */}
                                <div className="p-4 border-t border-gray-700 bg-gray-750 rounded-b-lg flex justify-end gap-3">
                                    <button
                                        onClick={() => handleDelete(selectedMessage.id)}
                                        className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded transition-colors text-sm font-medium"
                                    >
                                        Supprimer
                                    </button>
                                    <a
                                        href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-md transition-all text-sm"
                                    >
                                        Répondre par Email
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <span className="text-6xl mb-4">📩</span>
                                <p>Sélectionnez un message pour le lire</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            `}</style>
        </div>
    );
}
