<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
            $table->decimal('percentage', 5, 2);
            $table->timestamps();

            $table->unique(['user_id', 'goal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_rules');
    }
};
