<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        $defaults = [
            'daily_budget' => '50000',
            'monthly_income' => '0',
            'currency' => 'IDR',
        ];

        foreach ($users as $user) {
            foreach ($defaults as $key => $value) {
                Setting::setValue($user->id, $key, $value);
            }
        }
    }
}
