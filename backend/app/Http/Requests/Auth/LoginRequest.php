<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * 인가 여부
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 유효성 검사 규칙
     */
    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * 유효성 검사 에러 메시지 (한국어)
     */
    public function messages(): array
    {
        return [
            'email.required'    => '이메일은 필수입니다.',
            'email.email'       => '올바른 이메일 형식이 아닙니다.',
            'password.required' => '비밀번호는 필수입니다.',
        ];
    }
}
