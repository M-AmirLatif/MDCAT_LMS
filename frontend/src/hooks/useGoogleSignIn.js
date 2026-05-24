import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole } from '../lib/platform'

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_GOOGLE_CLIENT_ID
    : '') || ''

let scriptLoadPromise = null

function loadGoogleScript() {
  if (scriptLoadPromise) return scriptLoadPromise
  if (window.google?.accounts?.id) {
    scriptLoadPromise = Promise.resolve()
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => {
      scriptLoadPromise = null
      reject(new Error('Failed to load Google sign-in script'))
    }
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

function getGoogleTheme() {
  if (typeof document === 'undefined') return 'outline'
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'filled_black'
    : 'outline'
}

export function useGoogleSignIn({
  remember = true,
  nextPath = null,
  mode = 'signin',
} = {}) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const configured = !!GOOGLE_CLIENT_ID

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        toast.error('Google sign-in could not be completed. Please try again.')
        return
      }

      setLoading(true)
      try {
        const res = await API.post('/auth/google', {
          credential: response.credential,
          mode,
        })
        const { token, user } = res.data

        if (mode === 'signup') {
          if (user.needsPasswordSetup) {
            login(token, user, remember)
            toast.success(`Welcome, ${user.firstName}! Please set a password to finish setup.`)
            navigate('/set-password', { replace: true })
          } else {
            toast('You already have an account. Logging you in instead.', {
              icon: 'i',
            })
            login(token, user, remember)
            navigate(nextPath || getDefaultRouteForRole(user.role), { replace: true })
          }
        } else if (user.needsPasswordSetup) {
          login(token, user, remember)
          toast('Please complete your account setup by setting a password.')
          navigate('/set-password', { replace: true })
        } else {
          login(token, user, remember)
          navigate(nextPath || getDefaultRouteForRole(user.role), { replace: true })
        }
      } catch (requestError) {
        const status = requestError.response?.status
        if (mode === 'signin' && status === 404) {
          toast.error('No account was found for this Google account. Please sign up first.')
          navigate('/register', { replace: true })
        } else {
          toast.error(getUserFriendlyErrorMessage(requestError, 'Google sign-in is unavailable right now. Please try again.'))
        }
      } finally {
        setLoading(false)
      }
    },
    [login, mode, navigate, nextPath, remember],
  )

  const renderButton = useCallback(async () => {
    if (!configured || !containerRef.current) return

    setLoading(true)
    setError('')

    try {
      await loadGoogleScript()
      if (!containerRef.current || !window.google?.accounts?.id) {
        throw new Error('Google sign-in is unavailable right now.')
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      containerRef.current.replaceChildren()
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: getGoogleTheme(),
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
        shape: 'pill',
        width: Math.min(containerRef.current.offsetWidth || 340, 400),
        logo_alignment: 'left',
      })

      setReady(true)
    } catch (renderError) {
      console.error('Google Sign-In init error:', renderError)
      setReady(false)
      setError('Google sign-in is temporarily unavailable. Please retry.')
    } finally {
      setLoading(false)
    }
  }, [configured, handleCredentialResponse, mode])

  const buttonRef = useCallback((node) => {
    containerRef.current = node
    if (node && configured) {
      renderButton()
    }
  }, [configured, renderButton])

  const retry = useCallback(() => {
    setReady(false)
    setError('')
    renderButton()
  }, [renderButton])

  useEffect(() => {
    if (!configured || !containerRef.current) return
    renderButton()
  }, [configured, renderButton])

  return { buttonRef, ready, loading, configured, error, retry }
}
