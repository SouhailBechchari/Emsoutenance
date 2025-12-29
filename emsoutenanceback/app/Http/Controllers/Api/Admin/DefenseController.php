<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Defense;
use App\Models\JuryDefense;
use App\Models\Report;
use Illuminate\Http\Request;

/**
 * Contrôleur de gestion des Soutenances (Administrateur)
 *
 * Ce contrôleur gère :
 * 1. La planification des soutenances (date, salle).
 * 2. L'assignation des jurys.
 * 3. Le suivi du statut (programmée, passée).
 */
class DefenseController extends Controller
{
    /**
     * Liste toutes les soutenances.
     * Met également à jour automatiquement le statut des soutenances passées.
     */
    public function index(Request $request)
    {
        // --- MISE À JOUR AUTOMATIQUE ---
        // On passe en "completed" les soutenances dont la date est passée.
        // C'est une astuce simple pour éviter d'utiliser des tâches Cron complexes.
        Defense::where('status', 'scheduled')
            ->where('scheduled_at', '<', now())
            ->update(['status' => 'completed']);

        // --- PRÉPARATION DE LA REQUÊTE ---
        $query = Defense::with([
            'student.user',              // Pour afficher le nom de l'étudiant
            'report',                    // Pour lier au rapport
            'juryMembers.professor.user' // Pour afficher les noms des jurés
        ]);

        // FILTRE PAR DATE
        if ($request->has('date')) {
            $query->whereDate('scheduled_at', $request->date);
        }

        // FILTRE PAR FILIÈRE (via l'étudiant)
        if ($request->has('filiere')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('filiere', $request->filiere);
            });
        }

        // On trie par date croissante (les plus proches d'abord)
        $defenses = $query->orderBy('scheduled_at', 'asc')->paginate(15);

        return response()->json($defenses);
    }

    /**
     * Programmer une nouvelle soutenance.
     */
    public function store(Request $request)
    {
        // 1. Validation de base
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'report_id' => 'nullable|exists:reports,id',
            'scheduled_at' => 'required|date',
            'salle' => 'required|string',
        ]);

        // 2. Vérification de cohérence (Rapport appartient bien à l'étudiant ?)
        if ($request->filled('report_id')) {
            $report = Report::findOrFail($request->report_id);
            if ($report->student_id != $request->student_id) {
                return response()->json([
                    'message' => 'Le rapport sélectionné ne correspond pas à l\'étudiant choisi.'
                ], 400);
            }
        }

        // 3. Création de la soutenance
        $defense = Defense::create([
            'student_id' => $request->student_id,
            'report_id' => $request->report_id, // Peut être null
            'scheduled_at' => $request->scheduled_at,
            'salle' => $request->salle,
            'status' => 'scheduled',
        ]);

        // On retourne l'objet complet
        $defense->load(['student.user', 'report']);

        return response()->json($defense, 201);
    }

    /**
     * Affiche les détails d'une soutenance.
     */
    public function show(Defense $defense)
    {
        $defense->load([
            'student.user',
            'report',
            'juryMembers.professor.user'
        ]);

        return response()->json($defense);
    }

    /**
     * Met à jour les infos logistiques (Date, Salle, Statut).
     */
    public function update(Request $request, Defense $defense)
    {
        $request->validate([
            'scheduled_at' => 'sometimes|required|date',
            'salle' => 'sometimes|required|string',
            'status' => 'sometimes|required|in:scheduled,completed,cancelled',
        ]);

        $defense->update($request->only(['scheduled_at', 'salle', 'status']));

        return response()->json($defense->load(['student.user', 'report', 'juryMembers.professor.user']));
    }

    /**
     * Supprime une soutenance.
     */
    public function destroy(Defense $defense)
    {
        $defense->delete();
        return response()->json(['message' => 'Soutenance supprimée']);
    }

    /**
     * Assigner ou modifier le jury d'une soutenance.
     * Cette méthode remplace complètement l'ancien jury par le nouveau.
     */
    public function assignJury(Request $request, Defense $defense)
    {
        // Validation : on attend un tableau "jury" contenant des objets {professor_id, role}
        $request->validate([
            'jury' => 'required|array|min:2', // Au moins 2 membres
            'jury.*.professor_id' => 'required|exists:professors,id',
            'jury.*.role' => 'required|in:encadrant,rapporteur,examinateur,president',
        ]);

        // 1. On supprime les anciens membres pour éviter les doublons/conflits
        $defense->juryMembers()->delete();

        // 2. On ajoute les nouveaux membres
        foreach ($request->jury as $member) {
            JuryDefense::create([
                'defense_id' => $defense->id,
                'professor_id' => $member['professor_id'],
                'role' => $member['role'],
            ]);
        }

        // 3. On retourne la soutenance à jour
        $defense->load(['student.user', 'report', 'juryMembers.professor.user']);

        return response()->json([
            'message' => 'Jury assigné avec succès',
            'defense' => $defense
        ]);
    }
}

