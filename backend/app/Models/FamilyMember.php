<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilyMember extends Model
{
    protected $fillable = ['user_id', 'name', 'birth_date', 'relation'];

    protected $casts = [
        'birth_date' => 'date',
    ];

    protected $appends = ['age_in_months', 'age_display'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(FamilyMilestone::class);
    }

    public function getAgeInMonthsAttribute(): int
    {
        return (int) $this->birth_date->diffInMonths(now());
    }

    public function getAgeDisplayAttribute(): string
    {
        $years = $this->birth_date->diffInYears(now());
        $months = $this->birth_date->copy()->addYears($years)->diffInMonths(now());

        if ($years > 0) {
            return $months > 0 ? "{$years} tahun {$months} bulan" : "{$years} tahun";
        }
        return "{$months} bulan";
    }
}
