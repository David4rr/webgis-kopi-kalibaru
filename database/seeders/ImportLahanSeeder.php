<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lahan;

class ImportLahanSeeder extends Seeder
{
    public function run()
    {
        // Load data dari file JSON lama
        $jsonPath = storage_path('app/lahan_config.json');
        $data = json_decode(file_get_contents($jsonPath), true);

        foreach ($data as $key => $lahan) {
            Lahan::create([
                'nama' => $lahan['name'],
                'luas' => $lahan['luas'],
                'koordinat' => $lahan['boundary'],
                'elevasi' => 850, // default value
                'suhu' => 23.5,
                'curah_hujan' => 180.0,
                'pola_tanam' => 'monokultur',
                'produktivitas' => $lahan['totalProductivity'],
                'kategori' => $this->getKategori($lahan['totalProductivity'])
            ]);
        }
    }

    private function getKategori($produktivitas)
    {
        if ($produktivitas >= 3000) return 'Sangat Tinggi';
        if ($produktivitas >= 2000) return 'Tinggi';
        if ($produktivitas >= 1000) return 'Sedang';
        if ($produktivitas >= 500) return 'Rendah';
        return 'Sangat Rendah';
    }
}
