import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../SupabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Use useCallback to memoize fetchProfile
  const fetchProfile = useCallback(async (userId) => {
    try {
      console.log('Fetching profile for:', userId);
      const queryPromise = supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 3000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
        .catch(err => {
          console.error('Query timeout/error:', err);
          return { data: null, error: err };
        });

      console.log('Profile query result:', { hasData: !!data, error });

      if (error || !data) {
        console.log('Setting empty profile');
        setProfile({})
        return
      }

      console.log('Setting profile:', data.first_name);
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile({})
    }
  }, [])

  useEffect(() => {
    console.log('useAuth: useEffect mounted');
    let mounted = true;
    let profileFetched = false;
    
    const fetchProfileOnce = async (userId) => {
      if (profileFetched) {
        console.log('Profile already fetched, skipping');
        return;
      }
      profileFetched = true;
      await fetchProfile(userId);
    }
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user)
          if (!profileFetched) {
            await fetchProfileOnce(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
          profileFetched = false;
        }
        
        if (mounted) setLoading(false)
      }
    )
    
    // Check existing session
    const checkUser = async () => {
      try {
        console.log('Checking session...');
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('Session check result:', !!session?.user);
        if (!mounted) return;
        
        if (session?.user && !profileFetched) {
          setUser(session.user)
          await fetchProfileOnce(session.user.id)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    checkUser()

    return () => {
      console.log('useAuth: Cleanup');
      mounted = false;
      authListener.subscription.unsubscribe()
    }
  }, [fetchProfile])

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

      // Create employee profile
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: authData.user.id,
          username: additionalData.username,
          email: email,
          first_name: additionalData.firstName,
          last_name: additionalData.lastName,
          phone_number: additionalData.phoneNumber,
          address: additionalData.address,
          position: additionalData.position,
          is_active: true
        })

      if (employeeError) throw employeeError

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

      const { error } = await supabase
        .from('employees')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone_number: updates.phoneNumber,
          address: updates.address,
          position: updates.position
        })
        .eq('id', user.id)

      if (error) throw error

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