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
     * Obtenir le profil du professeur connecté
     */
    public function profile(Request $request)
    {
        $professor = $request->user()->professor;

        return response()->json($professor);
    }

    /**
     * Obtenir la liste des étudiants selon le rôle du professeur
     */
    public function getStudents(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            $students = collect();

            // Étudiants encadrés
            try {
                $encadres = $professor->studentsEncadres()->with('user')->get();
                $students = $students->merge($encadres->map(function ($student) {
                    $student->relation_type = 'encadrant';
                    return $student;
                }));
            } catch (\Exception $e) {
                // Ignorer les erreurs et continuer
            }

            // Étudiants rapportés
            try {
                $rapportes = $professor->studentsRapportes()->with('user')->get();
                $students = $students->merge($rapportes->map(function ($student) {
                    $student->relation_type = 'rapporteur';
                    return $student;
                }));
            } catch (\Exception $e) {
                // Ignorer les erreurs et continuer
            }

            return response()->json($students->unique('id')->values());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des étudiants', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtenir les rapports à examiner
     */
    public function getReports(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            $studentIds = collect();
            
            try {
                $studentIds = $studentIds->merge($professor->studentsEncadres()->pluck('id'));
            } catch (\Exception $e) {
                // Ignorer les erreurs
            }
            
            try {
                $studentIds = $studentIds->merge($professor->studentsRapportes()->pluck('id'));
            } catch (\Exception $e) {
                // Ignorer les erreurs
            }

            // Si aucune liste d'étudiants, retourner un tableau vide
            if ($studentIds->isEmpty()) {
                return response()->json([], 200);
            }

            $reports = Report::whereIn('student_id', $studentIds->toArray())
                ->with(['student.user', 'remarks'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($reports);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des rapports', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Ajouter une remarque à un rapport
     */
    public function addRemark(Request $request, Report $report)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $professor = $request->user()->professor;

        if (!$professor) {
            return response()->json(['message' => 'Profil professeur non trouvé'], 404);
        }

        // Vérifier que le professeur est encadrant ou rapporteur de l'étudiant
        $student = $report->student;
        $isEncadrant = $student->encadrant_id === $professor->id;
        $isRapporteur = $student->rapporteur_id === $professor->id;

        if (!$isEncadrant && !$isRapporteur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $remark = Remark::create([
            'report_id' => $report->id,
            'professor_id' => $professor->id,
            'content' => $request->content,
        ]);

        // Mettre à jour le statut du rapport si nécessaire
        if ($report->status === 'pending' || $report->status === 'validated') {
            $report->update(['status' => 'need_correction']);
        }

        return response()->json($remark, 201);
    }

    /**
     * Valider un rapport
     */
    public function validateReport(Request $request, Report $report)
    {
        $professor = $request->user()->professor;

        if (!$professor) {
            return response()->json(['message' => 'Profil professeur non trouvé'], 404);
        }

        // Seul le rapporteur peut valider
        $student = $report->student;
        if ($student->rapporteur_id !== $professor->id) {
            return response()->json(['message' => 'Seul le rapporteur peut valider le rapport'], 403);
        }

        $report->update([
            'status' => 'validated',
            'validated_at' => now(),
        ]);

        return response()->json($report);
    }

    /**
     * Obtenir les soutenances du professeur
     */
    public function getDefenses(Request $request)
    {
        try {
            $professor = $request->user()->professor;

            if (!$professor) {
                return response()->json([], 200);
            }

            try {
                $defenseIds = $professor->juryDefenses()->pluck('defense_id');
            } catch (\Exception $e) {
                // Si erreur, retourner un tableau vide
                return response()->json([], 200);
            }

            // Si aucune défense, retourner un tableau vide
            if ($defenseIds->isEmpty()) {
                return response()->json([], 200);
            }

            $defenses = Defense::whereIn('id', $defenseIds->toArray())
                ->with(['student.user', 'report', 'juryMembers.professor.user'])
                ->orderBy('scheduled_at', 'asc')
                ->get();

            return response()->json($defenses);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des soutenances', 'error' => $e->getMessage()], 500);
        }
    }
}

