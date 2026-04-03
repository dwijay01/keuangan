<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoalDeposit extends Model
{
    protected $fillable = ['goal_id', 'amount', 'deposit_date', 'note'];

    protected $casts = [
        'amount' => 'decimal:2',
        'deposit_date' => 'date',
    ];

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }
}
