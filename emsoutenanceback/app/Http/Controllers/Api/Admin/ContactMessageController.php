<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

/**
 * Contrôleur de Gestion des Messages de Contact
 *
 * Ce contrôleur permet à l'administrateur de lire, gérer et supprimer
 * les messages envoyés depuis le formulaire de contact du site.
 */
class ContactMessageController extends Controller
{
    /**
     * Liste tous les messages de contact.
     * Triés du plus récent au plus ancien.
     */
    public function index()
    {
        $messages = ContactMessage::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $messages,
            'total' => $messages->count(),
            'unread' => $messages->where('is_read', false)->count(), // Compteur de non-lus
        ]);
    }

    /**
     * Affiche un message spécifique.
     */
    public function show($id)
    {
        $message = ContactMessage::findOrFail($id);

        return response()->json([
            'data' => $message
        ]);
    }

    /**
     * Marque un message comme "Lu".
     */
    public function markAsRead($id)
    {
        $message = ContactMessage::findOrFail($id);
        $message->update(['is_read' => true]);

        return response()->json([
            'message' => 'Message marqué comme lu',
            'data' => $message
        ]);
    }

    /**
     * Marque un message comme "Non lu".
     */
    public function markAsUnread($id)
    {
        $message = ContactMessage::findOrFail($id);
        $message->update(['is_read' => false]);

        return response()->json([
            'message' => 'Message marqué comme non lu',
            'data' => $message
        ]);
    }

    /**
     * Supprime un message.
     */
    public function destroy($id)
    {
        $message = ContactMessage::findOrFail($id);
        $message->delete();

        return response()->json([
            'message' => 'Message supprimé avec succès'
        ]);
    }
}
