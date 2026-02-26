# Laravel & PHP 가이드 (Quick Reference)

## 📁 프로젝트 구조

```
app/
├── Http/Controllers/    ← 컨트롤러 (요청 처리)
├── Models/              ← Eloquent 모델 (DB 테이블 매핑)
├── Providers/           ← 서비스 프로바이더
routes/
├── web.php              ← 웹 라우트 정의
├── console.php          ← CLI 명령어
resources/views/         ← Blade 템플릿
database/migrations/     ← DB 마이그레이션
config/                  ← 설정 파일
```

---

## 🐳 Docker 명령어

```bash
# 컨테이너 시작 / 종료
docker compose up -d
docker compose down

# artisan 명령 실행
docker compose exec laravel-test-app php artisan <command>

# composer 명령 실행
docker compose exec laravel-test-app composer <command>

# 컨테이너 쉘 접속
docker compose exec laravel-test-app bash
```

---

## ⚡ 자주 쓰는 Artisan 명령어

```bash
# 컨트롤러 생성
php artisan make:controller PostController

# 모델 + 마이그레이션 동시 생성
php artisan make:model Post -m

# 리소스 컨트롤러 (CRUD 전체 메서드 포함)
php artisan make:controller PostController --resource

# 마이그레이션
php artisan migrate              # 실행
php artisan migrate:rollback     # 롤백
php artisan migrate:fresh        # 전체 초기화 후 재실행

# 라우트 목록
php artisan route:list

# 캐시 클리어
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

> ※ Docker 환경에서는 앞에 `docker compose exec laravel-test-app` 붙이기

---

## 🔧 PHP 8.3 주요 문법

### 타입 선언

```php
function getUser(int $id): User
{
    return User::findOrFail($id);
}
```

### match 표현식 (switch 대체)

```php
$status = match($code) {
    200 => 'OK',
    404 => 'Not Found',
    500 => 'Server Error',
    default => 'Unknown',
};
```

### Null 안전 연산자

```php
// 예전: $user->getAddress() ? $user->getAddress()->getCity() : null;
$city = $user->getAddress()?->getCity();
```

### Named Arguments

```php
// 인자 이름을 지정해서 순서 무관하게 전달
Route::get('/posts', action: [PostController::class, 'index']);
```

---

## 🛣️ 라우팅 (routes/web.php)

```php
use App\Http\Controllers\PostController;

// 기본 라우트
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::post('/posts', [PostController::class, 'store']);
Route::put('/posts/{id}', [PostController::class, 'update']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);

// 리소스 라우트 (위의 7개 라우트를 한줄로)
Route::resource('posts', PostController::class);

// 그룹 + 미들웨어
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
```

---

## 🎮 컨트롤러

```php
namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    // 목록
    public function index()
    {
        $posts = Post::all();
        return view('posts.index', compact('posts'));
    }

    // 상세
    public function show(int $id)
    {
        $post = Post::findOrFail($id);
        return view('posts.show', compact('post'));
    }

    // 생성
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'body'  => 'required',
        ]);

        Post::create($validated);
        return redirect('/posts');
    }

    // 수정
    public function update(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        $post->update($request->validate([
            'title' => 'required|max:255',
            'body'  => 'required',
        ]));
        return redirect("/posts/{$id}");
    }

    // 삭제
    public function destroy(int $id)
    {
        Post::findOrFail($id)->delete();
        return redirect('/posts');
    }
}
```

---

## 📦 Eloquent ORM (모델 & DB)

### 모델 기본

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    // ⚠️ create() 사용 시 필수!
    protected $fillable = ['title', 'body', 'user_id'];

    // 관계 정의
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
```

### CRUD 쿼리

```php
// 조회
$posts = Post::all();                              // 전체
$post  = Post::find(1);                            // ID로
$post  = Post::findOrFail(1);                      // 없으면 404
$posts = Post::where('status', 'published')->get(); // 조건
$post  = Post::where('slug', 'hello')->first();    // 하나만

// 생성
$post = Post::create(['title' => '제목', 'body' => '내용']);

// 수정
$post->update(['title' => '수정된 제목']);

// 삭제
$post->delete();

// 페이지네이션
$posts = Post::paginate(15);
```

### 관계 쿼리

```php
// Eager Loading (N+1 문제 방지!)
$posts = Post::with('user', 'comments')->get();

// 관계 접근
$post->user->name;           // 작성자 이름
$post->comments->count();    // 댓글 수
```

---

## 🗄️ 마이그레이션 (database/migrations/)

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();                          // bigint auto increment PK
            $table->foreignId('user_id')           // 외래키
                  ->constrained()                  // users 테이블 참조
                  ->onDelete('cascade');
            $table->string('title');               // varchar(255)
            $table->text('body');                   // text
            $table->string('status')->default('draft');
            $table->timestamps();                  // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

---

## 🌿 Blade 템플릿 (resources/views/)

### 레이아웃 (layouts/app.blade.php)

```html
<!DOCTYPE html>
<html>
    <head>
        <title>@yield('title', 'Laravel')</title>
    </head>
    <body>
        <nav><!-- 네비게이션 --></nav>
        <main>@yield('content')</main>
    </body>
</html>
```

### 페이지 (posts/index.blade.php)

```html
@extends('layouts.app') @section('title', '게시글 목록') @section('content')
<h1>게시글 목록</h1>

@foreach ($posts as $post)
<div>
    <h2>{{ $post->title }}</h2>
    <p>{{ $post->body }}</p>
    <small>{{ $post->created_at->format('Y-m-d') }}</small>
</div>
@endforeach @if ($posts->isEmpty())
<p>게시글이 없습니다.</p>
@endif @endsection
```

### 폼

```html
<form method="POST" action="/posts">
    @csrf {{-- ⚠️ POST 요청 시 필수! --}}

    <input type="text" name="title" value="{{ old('title') }}" />
    @error('title')
    <span>{{ $message }}</span>
    @enderror

    <textarea name="body">{{ old('body') }}</textarea>

    <button type="submit">저장</button>
</form>
```

---

## ⚠️ 자주 실수하는 것들

| 실수                         | 해결                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `.env` 수정했는데 반영 안 됨 | `php artisan config:clear` 실행                                         |
| `create()` 시 에러           | 모델에 `$fillable` 설정 확인                                            |
| POST 요청 시 419 에러        | `@csrf` 빠졌는지 확인                                                   |
| 관계 쿼리가 느림 (N+1)       | `with()`로 Eager Loading 사용                                           |
| 마이그레이션 수정하고 싶음   | 이미 실행된 건 수정 ❌ → 새 마이그레이션 생성                           |
| `php artisan` 안 됨          | Docker에서 실행: `docker compose exec laravel-test-app php artisan ...` |

---

## 💡 Laravel 11~12 변경사항

| 항목        | 변경 사항                                         |
| ----------- | ------------------------------------------------- |
| 구조 간소화 | 미들웨어, HTTP 커널 파일 제거 (프레임워크 내부로) |
| `api.php`   | 기본 미포함, `php artisan install:api` 로 설치    |
| 기본 DB     | SQLite (MySQL로 변경 가능)                        |
| 테스트      | Pest 기본 (PHPUnit도 사용 가능)                   |
| 설정 파일   | `config/` 파일이 줄어듦 (필요한 것만 생성)        |
