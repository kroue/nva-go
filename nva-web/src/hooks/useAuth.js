import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Fetch additional profile information
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      // Fetch profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          employees(position, department, is_active),
          customers(company_name, is_corporate_account, is_barred)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signUp = async (email, password, additionalData) => {
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: additionalData.firstName,
            last_name: additionalData.lastName,
            phone_number: additionalData.phoneNumber,
          }
        }
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: additionalData.firstName,
          last_name: additionalData.lastName,
          email: email,
          phone_number: additionalData.phoneNumber,
          address: additionalData.address
        })

      if (profileError) throw profileError

      // Create customer or employee profile based on role
      if (additionalData.role === 'customer') {
        await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            company_name: additionalData.companyName,
            is_corporate_account: additionalData.isCorporate || false
          })
      } else if (additionalData.role === 'employee') {
        await supabase
          .from('employees')
          .insert({
            id: authData.user.id,
            position: additionalData.position,
            department: additionalData.department
          })
      }

      return authData.user
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return data.user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone_number: updates.phoneNumber,
          address: updates.address
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update role-specific table if needed
      if (profile.employees) {
        await supabase
          .from('employees')
          .update({
            position: updates.position,
            department: updates.department
          })
          .eq('id', user.id)
      } else if (profile.customers) {
        await supabase
          .from('customers')
          .update({
            company_name: updates.companyName,
            is_corporate_account: updates.isCorporate
          })
          .eq('id', user.id)
      }

      // Refetch profile to get updated information
      await fetchProfile(user.id)
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }
}