<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Remark;
use App\Models\Defense;
use Illuminate\Http\Request;

class ProfessorController extends Controller
{
    /**
     * Voir son propre profil professeur
     */
    public function profile(Request $request)
    {
        // 1. Récupérer le profil professeur lié à l'utilisateur connecté
        $professor = $request->user()->professor;

        return response()->json($professor);
    }

    /**
     * Voir mes étudiants (ceux que j'encadre et ceux que je rapporte)
     */
    public function getStudents(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            // Nous allons construire la liste des étudiants en deux étapes
            $students = collect();

            // 1. Ajouter les étudiants que j'encadre
            $encadres = $professor->studentsEncadres()->with('user')->get();
            // On ajoute une petite étiquette "relation_type" pour le frontend
            $students = $students->merge($encadres->map(function ($student) {
                $student->relation_type = 'encadrant';
                return $student;
            }));

            // 2. Ajouter les étudiants que je rapporte (j'évalue)
            $rapportes = $professor->studentsRapportes()->with('user')->get();
            $students = $students->merge($rapportes->map(function ($student) {
                $student->relation_type = 'rapporteur';
                return $student;
            }));

            // 3. Supprimer les doublons (au cas où je suis les deux pour un même étudiant, ce qui est rare)
            // .values() permet de réinitialiser les clés du tableau (0, 1, 2...)
            return response()->json($students->unique('id')->values());

        } catch (\Exception $e) {
            // En cas d'erreur, on log le problème mais on ne plante pas l'appli client
            \Log::error('Erreur getStudents: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des étudiants'], 500);
        }
    }

    /**
     * Voir les rapports à corriger/noter
     */
    public function getReports(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            // 1. Trouver les IDs de TOUS mes étudiants
            $studentIds = collect();

            try {
                // IDs des étudiants encadrés
                $studentIds = $studentIds->merge($professor->studentsEncadres()->pluck('id'));
            } catch (\Exception $e) { /* Ignorer */
            }

            try {
                // IDs des étudiants rapportés
                $studentIds = $studentIds->merge($professor->studentsRapportes()->pluck('id'));
            } catch (\Exception $e) { /* Ignorer */
            }

            // Si je n'ai aucun étudiant, pas de rapports
            if ($studentIds->isEmpty()) {
                return response()->json([], 200);
            }

            // 2. Récupérer les rapports de ces étudiants
            $reports = Report::whereIn('student_id', $studentIds->toArray())
                ->with(['student.user', 'remarks']) // On charge l'étudiant et les remarques existantes
                ->orderBy('created_at', 'desc') // Les plus récents en premier
                ->get();

            return response()->json($reports);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des rapports', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Ajouter une remarque (commentaire) sur un rapport
     */
    public function addRemark(Request $request, Report $report)
    {
        // 1. Validation du texte de la remarque
        $request->validate([
            'content' => 'required|string',
        ]);

        $professor = $request->user()->professor;

        if (!$professor) {
            return response()->json(['message' => 'Profil professeur non trouvé'], 404);
        }

        // 2. Vérification des droits
        // Suis-je l'encadrant ou le rapporteur de cet étudiant ?
        $student = $report->student;
        $isEncadrant = $student->encadrant_id === $professor->id;
        $isRapporteur = $student->rapporteur_id === $professor->id;

        if (!$isEncadrant && !$isRapporteur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // 3. Création de la remarque
        $remark = Remark::create([
            'report_id' => $report->id,
            'professor_id' => $professor->id,
            'content' => $request->input('content'),
        ]);

        // 4. Mise à jour du statut du rapport
        // Si je fais une remarque, le rapport passe probablement en "A corriger"
        if ($report->status === 'pending' || $report->status === 'validated') {
            $report->update(['status' => 'need_correction']);
        }

        return response()->json($remark, 201);
    }

    /**
     * Valider un rapport (C'est bon, prêt pour la soutenance)
     */
    public function validateReport(Request $request, Report $report)
    {
        $professor = $request->user()->professor;

        if (!$professor) {
            return response()->json(['message' => 'Profil professeur non trouvé'], 404);
        }

        // 1. Vérification : SEUL le Rapporteur a le droit de valider définitivement
        $student = $report->student;
        if ($student->rapporteur_id !== $professor->id) {
            return response()->json(['message' => 'Seul le rapporteur peut valider le rapport'], 403);
        }

        // 2. Mise à jour
        $report->update([
            'status' => 'validated',
            'validated_at' => now(),
        ]);

        return response()->json($report);
    }

    /**
     * Voir les soutenances où je suis jury
     */
    public function getDefenses(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            // Petite astuce : on met à jour les statuts ici car on n'a pas de serveur task scheduler
            $this->updatePastDefensesStatus();

            // 1. Récupérer les IDs des soutenances où je suis jury
            // juryDefenses() est la relation Professeur -> Soutenances
            $defenseIds = $professor->juryDefenses()->pluck('defense_id');

            if ($defenseIds->isEmpty()) {
                return response()->json([], 200);
            }

            // 2. Récupérer les infos complètes des soutenances
            $defenses = Defense::whereIn('id', $defenseIds->toArray())
                ->with(['student.user', 'report', 'juryMembers.professor.user'])
                ->orderBy('scheduled_at', 'asc') // Les plus proches en premier
                ->get();

            return response()->json($defenses);

        } catch (\Exception $e) {
            \Log::error('Erreur getDefenses: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des soutenances'], 500);
        }
    }

    /**
     * Fonction privée utilitaire
     * Met à jour les soutenances passées en "Terminée"
     */
    private function updatePastDefensesStatus()
    {
        Defense::where('status', 'scheduled')
            ->where('scheduled_at', '<', now())
            ->update(['status' => 'completed']);
    }
}

