<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bill extends Model
{
    protected $fillable = [
        'user_id', 'name', 'amount', 'due_day', 'category_id',
        'is_recurring', 'start_date', 'end_date',
        'total_installments', 'paid_installments'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function getRemainingInstallmentsAttribute(): ?int
    {
        if ($this->total_installments === null) return null;
        return max(0, $this->total_installments - $this->paid_installments);
    }
}
