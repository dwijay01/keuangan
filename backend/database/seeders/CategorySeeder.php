<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        $categories = [
            // Expense categories
            ['name' => 'Dapur', 'icon' => 'utensils-crossed', 'type' => 'expense', 'color' => '#FF6B35', 'sort_order' => 1],
            ['name' => 'Transportasi', 'icon' => 'fuel', 'type' => 'expense', 'color' => '#FFB800', 'sort_order' => 2],
            ['name' => 'Susu & Popok', 'icon' => 'baby', 'type' => 'expense', 'color' => '#00D4FF', 'sort_order' => 3],
            ['name' => 'Tagihan', 'icon' => 'receipt', 'type' => 'expense', 'color' => '#FF0055', 'sort_order' => 4],
            ['name' => 'Pendidikan', 'icon' => 'graduation-cap', 'type' => 'expense', 'color' => '#A855F7', 'sort_order' => 5],
            ['name' => 'Hiburan', 'icon' => 'gamepad-2', 'type' => 'expense', 'color' => '#FF69B4', 'sort_order' => 6],
            ['name' => 'Belanja Rumah', 'icon' => 'shopping-cart', 'type' => 'expense', 'color' => '#4ECDC4', 'sort_order' => 7],
            ['name' => 'Kesehatan', 'icon' => 'heart-pulse', 'type' => 'expense', 'color' => '#FF4444', 'sort_order' => 8],
            // Income categories
            ['name' => 'Gaji', 'icon' => 'wallet', 'type' => 'income', 'color' => '#00FF66', 'sort_order' => 9],
            ['name' => 'Pendapatan Sampingan', 'icon' => 'trending-up', 'type' => 'income', 'color' => '#00D4FF', 'sort_order' => 10],
            ['name' => 'Bonus', 'icon' => 'gift', 'type' => 'income', 'color' => '#FFB800', 'sort_order' => 11],
        ];

        foreach ($users as $user) {
            foreach ($categories as $category) {
                Category::firstOrCreate(
                    ['user_id' => $user->id, 'name' => $category['name']],
                    array_merge($category, ['user_id' => $user->id])
                );
            }
        }
    }
}
