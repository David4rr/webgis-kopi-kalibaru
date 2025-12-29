<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Lahan;

class LahanController extends Controller
{
    // Ambil semua data lahan untuk API
    public function getAll()
    {
        $lahans = Lahan::all();
        return response()->json($lahans);
    }

    // Simpan lahan baru
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string',
            'luas' => 'required|numeric',
            'koordinat' => 'required|array',
            'elevasi' => 'required|numeric',
            'suhu' => 'required|numeric',
            'curah_hujan' => 'required|numeric',
            'pola_tanam' => 'required|string',
            'produktivitas' => 'required|numeric',
            'kategori' => 'required|string'
        ]);

        $lahan = Lahan::create($data);
        return response()->json($lahan, 201);
    }

    // Detail lahan
    public function show($id)
    {
        $lahan = Lahan::findOrFail($id);
        return response()->json($lahan);
    }

    // Hapus lahan
    public function destroy($id)
    {
        Lahan::destroy($id);
        return response()->json(['message' => 'Lahan deleted']);
    }

    // Update lahan
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nama' => 'required|string',
            'luas' => 'required|numeric',
            'koordinat' => 'required|array',
            'elevasi' => 'required|numeric',
            'suhu' => 'required|numeric',
            'curah_hujan' => 'required|numeric',
            'pola_tanam' => 'required|string',
            'produktivitas' => 'required|numeric',
            'kategori' => 'required|string'
        ]);

        $lahan = Lahan::findOrFail($id);
        $lahan->fill($data);
        $lahan->save();

        return response()->json($lahan);
    }
}
