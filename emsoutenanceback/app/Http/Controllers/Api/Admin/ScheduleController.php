<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Defense;
use Illuminate\Http\Request;

/**
 * Contrôleur de Consultation des Plannings
 *
 * Ce contrôleur est dédié à la visualisation (Read-Only) des soutenances sont différentes formes.
 * Il permet d'extraire les données pour les vues "Calendrier", "Par Filière" ou "Par Professeur".
 */
class ScheduleController extends Controller
{
    /**
     * Planning global des soutenances
     * Peut être filtré par date ou période.
     */
    public function index(Request $request)
    {
        $query = Defense::with([
            'student.user',
            'report',
            'juryMembers.professor.user'
        ]);

        // Filtre : Jour précis
        if ($request->has('date')) {
            $query->whereDate('scheduled_at', $request->date);
        }

        // Filtre : Période (Début - Fin)
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('scheduled_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        // On retourne tout le planning trié par ordre chronologique
        $defenses = $query->orderBy('scheduled_at', 'asc')->get();

        return response()->json($defenses);
    }

    /**
     * Planning filtré par Filière
     * Utile pour afficher le calendrier spécifique à une spécialité.
     */
    public function byFiliere(Request $request)
    {
        $request->validate([
            'filiere' => 'required|string',
        ]);

        // On utilise whereHas pour filtrer sur une propriété de la relation 'student'
        $defenses = Defense::with(['student.user', 'report', 'juryMembers.professor.user'])
            ->whereHas('student', function ($query) use ($request) {
                $query->where('filiere', $request->filiere);
            })
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json($defenses);
    }

    /**
     * Planning par Encadrant (Professeur)
     * Permet à un prof ou à l'admin de voir toutes les soutenances suivies par ce prof.
     */
    public function byEncadrant(Request $request)
    {
        $request->validate([
            'encadrant_id' => 'required|exists:professors,id',
        ]);

        $defenses = Defense::with(['student.user', 'report', 'juryMembers.professor.user'])
            ->whereHas('student', function ($query) use ($request) {
                $query->where('encadrant_id', $request->encadrant_id);
            })
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json($defenses);
    }
}

