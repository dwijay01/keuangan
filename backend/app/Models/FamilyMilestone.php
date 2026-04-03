<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyMilestone extends Model
{
    protected $fillable = ['family_member_id', 'name', 'age_months', 'is_completed'];

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    public function familyMember(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class);
    }
}
