<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modèle Soutenance (Defense)
 *
 * Représente l'événement de soutenance.
 * - Lie un Étudiant, un Rapport validé et une date/lieu.
 * - Est associé à un Jury (`juryMembers`) composé de plusieurs `Professor`.
 */
class Defense extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'report_id',
        'scheduled_at',
        'salle',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }

    /**
     * Relation avec l'étudiant
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Relation avec le rapport
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Relation avec les membres du jury
     */
    public function juryMembers(): HasMany
    {
        return $this->hasMany(JuryDefense::class);
    }
}

