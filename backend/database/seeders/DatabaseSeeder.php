<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $names = ['김철수', '이영희', '박지성', '최동원', '정우성'];

        foreach ($names as $index => $name) {
            $num = $index + 1;
            User::factory()->create([
                'name' => "{$name}",
                'email' => "test{$num}@test.com",
                // password 생략 혹은 'password123' 넣기. 보통 factory 기본값으로 'password' 문자열의 해시지만 명시적으로 넣는 게 좋음.
                'password' => bcrypt('password123'),
            ]);
        }
    }
}
