<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::where('user_id', $request->user()->id);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json(
            $query->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'string|max:50',
            'type' => 'required|in:income,expense',
            'color' => 'string|max:7',
        ]);

        $maxOrder = Category::where('user_id', $request->user()->id)->max('sort_order') ?? 0;

        $category = Category::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'icon' => $request->icon ?? 'circle',
            'type' => $request->type,
            'color' => $request->color ?? '#A0A0A0',
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'string|max:100',
            'icon' => 'string|max:50',
            'type' => 'in:income,expense',
            'color' => 'string|max:7',
            'sort_order' => 'integer',
        ]);

        $category->update($request->only(['name', 'icon', 'type', 'color', 'sort_order']));

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }
}
