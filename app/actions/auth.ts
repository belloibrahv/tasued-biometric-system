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
      }
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Registration failed' }

  // 2. Sync Profile to Public DB
  try {
    const syncRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/sync-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: authData.user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        otherNames: formData.otherNames || undefined,
        matricNumber: formData.matricNumber.toUpperCase(),
        email: formData.email.toLowerCase(),
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        department: formData.department,
        level: formData.level,
      }),
    })

    if (!syncRes.ok) {
      const errorData = await syncRes.json()
      return { error: errorData.error || 'Profile synchronization failed' }
    }
  } catch (err) {
    console.error('Registration Sync Error:', err)
    // Continue if sync fails - can be retried later
  }

  // 3. Enroll Biometric (Internal API call as we are on server)
  try {
    const biometricRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/biometric/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session?.access_token}`
      },
      body: JSON.stringify({
        facialTemplate: JSON.stringify(facialEmbedding),
        facialPhoto: facialPhoto,
      }),
    })

    if (!biometricRes.ok) {
      const errorData = await biometricRes.json()
      return { error: errorData.error || 'Biometric enrollment failed' }
    }
  } catch (err) {
    console.error('Biometric Enrollment Error:', err)
  }

  return { success: true, target: '/dashboard' }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
