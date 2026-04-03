<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Category;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Seed default categories for new user
        $categories = [
            ['name' => 'Dapur', 'icon' => 'utensils-crossed', 'type' => 'expense', 'color' => '#FF6B35', 'sort_order' => 1],
            ['name' => 'Transportasi', 'icon' => 'fuel', 'type' => 'expense', 'color' => '#FFB800', 'sort_order' => 2],
            ['name' => 'Susu & Popok', 'icon' => 'baby', 'type' => 'expense', 'color' => '#00D4FF', 'sort_order' => 3],
            ['name' => 'Tagihan', 'icon' => 'receipt', 'type' => 'expense', 'color' => '#FF0055', 'sort_order' => 4],
            ['name' => 'Pendidikan', 'icon' => 'graduation-cap', 'type' => 'expense', 'color' => '#A855F7', 'sort_order' => 5],
            ['name' => 'Hiburan', 'icon' => 'gamepad-2', 'type' => 'expense', 'color' => '#FF69B4', 'sort_order' => 6],
            ['name' => 'Belanja Rumah', 'icon' => 'shopping-cart', 'type' => 'expense', 'color' => '#4ECDC4', 'sort_order' => 7],
            ['name' => 'Kesehatan', 'icon' => 'heart-pulse', 'type' => 'expense', 'color' => '#FF4444', 'sort_order' => 8],
            ['name' => 'Gaji', 'icon' => 'wallet', 'type' => 'income', 'color' => '#00FF66', 'sort_order' => 9],
            ['name' => 'Pendapatan Sampingan', 'icon' => 'trending-up', 'type' => 'income', 'color' => '#00D4FF', 'sort_order' => 10],
            ['name' => 'Bonus', 'icon' => 'gift', 'type' => 'income', 'color' => '#FFB800', 'sort_order' => 11],
        ];

        foreach ($categories as $category) {
            Category::create(array_merge($category, ['user_id' => $user->id]));
        }

        // Seed default settings
        Setting::setValue($user->id, 'daily_budget', '50000');
        Setting::setValue($user->id, 'monthly_income', '0');
        Setting::setValue($user->id, 'currency', 'IDR');

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
