<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * 인가 여부 (누구나 회원가입 가능)
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
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * 유효성 검사 에러 메시지 (한국어)
     */
    public function messages(): array
    {
        return [
            'name.required'      => '이름은 필수입니다.',
            'email.required'     => '이메일은 필수입니다.',
            'email.email'        => '올바른 이메일 형식이 아닙니다.',
            'email.unique'       => '이미 사용 중인 이메일입니다.',
            'password.required'  => '비밀번호는 필수입니다.',
            'password.min'       => '비밀번호는 최소 8자 이상이어야 합니다.',
            'password.confirmed' => '비밀번호 확인이 일치하지 않습니다.',
        ];
    }
}
