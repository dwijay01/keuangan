<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Bill;
use App\Models\FamilyMember;
use Carbon\Carbon;

class DummySeeder extends Seeder
{
    public function run()
    {
        $user = User::first();
        if (!$user) {
            echo "Tidak ada user.\n";
            return;
        }

        echo "Memeriksa data untuk user: {$user->email}\n";

        $catIncome = Category::where('type', 'income')->where('user_id', $user->id)->first() ?? Category::where('type', 'income')->first();
        $catExpense = Category::where('type', 'expense')->where('user_id', $user->id)->first() ?? Category::where('type', 'expense')->first();

        // 1. Cek Transaksi (Arus Kas)
        $txCount = Transaction::where('user_id', $user->id)->count();
        if ($txCount < 5) {
            echo "Menambahkan dummy transaksi (cashflow 12 bulan terakhir)...\n";
            for ($i = 0; $i < 12; $i++) {
                $date = Carbon::now()->subMonths($i)->startOfMonth()->addDays(rand(1, 25));
                
                // Pemasukan
                Transaction::create([
                    'user_id' => $user->id,
                    'category_id' => $catIncome->id ?? 1,
                    'amount' => rand(5000000, 15000000),
                    'type' => 'income',
                    'transaction_date' => $date,
                    'note' => 'Gaji Bulanan',
                ]);

                // Pengeluaran
                for ($j = 0; $j < rand(3, 8); $j++) {
                    Transaction::create([
                        'user_id' => $user->id,
                        'category_id' => $catExpense->id ?? 2,
                        'amount' => rand(50000, 1000000),
                        'type' => 'expense',
                        'transaction_date' => $date->copy()->addDays(rand(0, 5)),
                        'note' => 'Pengeluaran harian',
                    ]);
                }
            }
        }

        // 2. Cek Bill (Kalender Bebas Cicilan)
        $billCount = Bill::where('user_id', $user->id)->whereNotNull('total_installments')->count();
        if ($billCount == 0) {
            echo "Menambahkan dummy cicilan (Kalender Bebas Cicilan)...\n";
            Bill::create([
                'user_id' => $user->id,
                'category_id' => $catExpense->id ?? 2,
                'name' => 'KPR Rumah',
                'amount' => 3000000,
                'due_day' => 15,
                'is_recurring' => true,
                'total_installments' => 120,
                'paid_installments' => 35
            ]);
            
            Bill::create([
                'user_id' => $user->id,
                'category_id' => $catExpense->id ?? 2,
                'name' => 'Cicilan Motor',
                'amount' => 850000,
                'due_day' => 5,
                'is_recurring' => true,
                'total_installments' => 36,
                'paid_installments' => 28
            ]);
        }

        // 3. Cek Family Members (Timeline Anak)
        $familyCount = FamilyMember::where('user_id', $user->id)->where('relation', 'Anak')->count();
        if ($familyCount == 0) {
            echo "Menambahkan dummy anggota keluarga (Anak untuk Timeline)...\n";
            FamilyMember::create([
                'user_id' => $user->id,
                'name' => 'Budi Junior',
                'relation' => 'Anak',
                'birth_date' => Carbon::now()->subYears(2)->subMonths(3), // Anak usia 2 tahun 3 bulan
            ]);
        }

        echo "Selesai.\n";
    }
}
