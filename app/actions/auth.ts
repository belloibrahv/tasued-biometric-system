'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const loginType = formData.get('loginType') as string
  const redirectPath = (formData.get('redirect') as string) || '/dashboard'

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Handle role-based redirection logic
  const type = data.user.user_metadata?.type || 'student'
  const role = data.user.user_metadata?.role || (type === 'admin' ? 'ADMIN' : 'STUDENT')

  let target = redirectPath
  if (target === '/login' || target === '/') {
    target = '/dashboard'
  }

  if (type === 'admin') {
    target = role === 'OPERATOR' ? '/operator' : '/admin'
  }

  return { success: true, target }
}

export async function register(formData: any, facialEmbedding: number[], facialPhoto: string) {
  const supabase = createClient()

  // 1. Supabase Auth Sign Up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        matric_number: formData.matricNumber.toUpperCase(),
        full_name: `${formData.firstName} ${formData.lastName}`,
        type: 'student',
        role: 'STUDENT',
        biometricEnrolled: true
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard`
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Registration failed' }

  // Check if session was created (Supabase might require email confirmation)
  if (!authData.session) {
    console.warn('Registration: No session created - email confirmation may be required')
    // Still proceed with profile creation, but inform user
  }

  // 2. Sync Profile to Public DB (Direct Service Call)
  try {
    const UserService = (await import('@/lib/services/user-service')).default
    await UserService.syncUserFromAuth(authData.user)
  } catch (err: any) {
    console.error('Registration Sync Error:', err)
    // Return the specific error message if it's one we threw (e.g. matric number already exists)
    const errorMessage = err.message || 'Failed to create user profile. Please contact support.'
    return { error: errorMessage }
  }

  // 3. Enroll Biometric (Direct Service Call - No more ECONNREFUSED)
  try {
    const BiometricService = (await import('@/lib/services/biometric-service')).default
    await BiometricService.enroll({
      userId: authData.user.id,
      facialTemplate: facialEmbedding,
      facialPhoto: facialPhoto,
    }, 'system-register', 'server-action');
  } catch (err) {
    console.warn('Biometric enrollment failed during registration:', err);
    // Don't fail the entire registration since biometric enrollment can be done later
  }

  // 4. If session exists, user is auto-logged in
  // If not, they need to verify email first
  if (authData.session) {
    return { success: true, target: '/dashboard', autoLogin: true }
  } else {
    return {
      success: true,
      target: '/login',
      autoLogin: false,
      message: 'Registration successful! Please check your email to verify your account.'
    }
  }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()

  // Clear the auth token cookie
  cookies().delete('auth-token')

  redirect('/')
}
