<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;

/**
 * Contrôleur de Gestion des Rapports (Administrateur)
 *
 * Permet à l'admin de visualiser tous les rapports soumis par les étudiants.
 * Il peut filtrer par statut (validé, en attente...) ou par version.
 */
class ReportController extends Controller
{
    /**
     * Liste de tous les rapports
     */
    public function index(Request $request)
    {
        // Chargement des relations utiles (Étudiant, Remarques des professeurs)
        $query = Report::with(['student.user', 'remarks.professor.user']);

        // FILTRES
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('version')) {
            $query->where('version', $request->version);
        }

        // Tri par date de création décroissante (plus récents en premier)
        $reports = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($reports);
    }

    /**
     * Valider un rapport (Action Admin)
     * Cette méthode sert de filet de sécurité ou de validation finale.
     */
    public function validateReport(Request $request, Report $report)
    {
        // En principe, c'est le rapporteur (professeur) qui valide.
        // Mais l'admin peut avoir le dernier mot ou débloquer une situation.

        if ($report->status !== 'validated') {
            // Optionnel : on pourrait forcer la validation ici si on voulait
            // $report->update(['status' => 'validated']);

            return response()->json([
                'message' => 'Attention : Ce rapport n\'a pas encore été validé par le rapporteur.'
            ], 200); // 200 OK mais avec un message d'avertissement
        }

        return response()->json([
            'message' => 'Rapport confirmé.',
            'report' => $report
        ]);
    }
}

