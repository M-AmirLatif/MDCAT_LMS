import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole } from '../lib/platform'

const GOOGLE_SCRIPT_ID = 'google-identity-services'

export function useGoogleSignIn({ remember = true, nextPath = '', mode = 'signin' } = {}) {
  const buttonRef = useRef(null)
  const initializedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

  const handleCredential = useCallback(
    async ({ credential }) => {
      if (!credential) {
        toast.error('Google did not return a sign-in credential.')
        return
      }

      try {
        const res = await API.post('/auth/google', { credential })
        const user = res.data.user
        login(res.data.token, user, remember)
        toast.success(mode === 'signup' ? 'Google account connected.' : 'Signed in with Google.')

        if (user?.needsPasswordSetup) {
          navigate('/set-password')
          return
        }

        navigate(nextPath || getDefaultRouteForRole(user?.role || 'student'))
      } catch (error) {
        toast.error(error.response?.data?.error || 'Google sign-in failed')
      }
    },
    [login, mode, navigate, nextPath, remember],
  )

  useEffect(() => {
    if (!clientId || !buttonRef.current || initializedRef.current) return

    const loadGoogle = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve()
          return
        }

        const existing = document.getElementById(GOOGLE_SCRIPT_ID)
        if (existing) {
          existing.addEventListener('load', resolve, { once: true })
          existing.addEventListener('error', reject, { once: true })
          return
        }

        const script = document.createElement('script')
        script.id = GOOGLE_SCRIPT_ID
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.addEventListener('load', resolve, { once: true })
        script.addEventListener('error', reject, { once: true })
        document.head.appendChild(script)
      })

    let cancelled = false

    loadGoogle()
      .then(() => {
        if (cancelled || initializedRef.current || !buttonRef.current) return
        if (!window.google?.accounts?.id) return

        initializedRef.current = true
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          width: Math.min(buttonRef.current.offsetWidth || 360, 420),
        })
        setReady(true)
      })
      .catch(() => {
        toast.error('Google sign-in script failed to load.')
      })

    return () => {
      cancelled = true
    }
  }, [clientId, handleCredential, mode])

  return {
    buttonRef,
    configured: Boolean(clientId),
    ready,
  }
}
