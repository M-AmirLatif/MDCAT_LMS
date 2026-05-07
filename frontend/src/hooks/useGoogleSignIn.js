/**
 * useGoogleSignIn.js
 *
 * Fixes:
 * 1. Button disappearing — use a stable callback ref so the div is always
 *    found after lazy-render, and re-initialize whenever the ref attaches.
 * 2. mode:'signup' → new user → redirect to /set-password
 * 3. mode:'signup' → existing user → toast + redirect to /login
 * 4. mode:'signin' → new user → toast + redirect to /register
 * 5. mode:'signin' → existing user with needsPasswordSetup → /set-password
 * 6. mode:'signin' → existing user → dashboard
 * 7. Google script loaded once globally (idempotent).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
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
    const existing = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]',
    )
    if (existing) {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
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

export function useGoogleSignIn({
  remember = true,
  nextPath = null,
  mode = 'signin',
} = {}) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const initializedRef = useRef(false)

  const configured = !!GOOGLE_CLIENT_ID

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        toast.error('Google sign-in failed. Please try again.')
        return
      }
      setLoading(true)
      try {
        const res = await API.post('/auth/google', {
          credential: response.credential,
          mode, // send mode so backend can optionally use it (future-proof)
        })
        const { token, user } = res.data

        if (mode === 'signup') {
          if (user.needsPasswordSetup) {
            // New Google user — store token/user and send to set-password
            login(token, user, true)
            toast.success(
              `Welcome, ${user.firstName}! Please set a password to finish setup.`,
            )
            navigate('/set-password', { replace: true })
          } else {
            // Existing user tried to sign up with Google
            toast('You already have an account. Logging you in instead.', {
              icon: 'ℹ️',
            })
            login(token, user, remember)
            navigate(nextPath || getDefaultRouteForRole(user.role), {
              replace: true,
            })
          }
        } else {
          // mode === 'signin'
          if (user.needsPasswordSetup) {
            // Google user exists but hasn't set a password — go finish setup
            login(token, user, true)
            toast('Please complete your account setup by setting a password.')
            navigate('/set-password', { replace: true })
          } else {
            login(token, user, remember)
            navigate(nextPath || getDefaultRouteForRole(user.role), {
              replace: true,
            })
          }
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error

        if (mode === 'signin' && status === 404) {
          toast.error(
            'No account found for this Google account. Please sign up first.',
          )
          navigate('/register', { replace: true })
        } else {
          toast.error(message || 'Google sign-in failed. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [login, navigate, remember, nextPath, mode],
  )

  // Stable callback ref — called whenever React attaches/detaches the DOM node
  const buttonRef = useCallback(
    (node) => {
      containerRef.current = node
      if (!node || !configured) return

      // Re-render button whenever the node is attached
      loadGoogleScript()
        .then(() => {
          if (!containerRef.current) return

          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          // Clear previous render to avoid duplicate buttons
          containerRef.current.innerHTML = ''

          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'pill',
            width: Math.min(containerRef.current.offsetWidth || 320, 400),
          })

          initializedRef.current = true
          setReady(true)
        })
        .catch((err) => {
          console.error('Google Sign-In init error:', err)
          setReady(false)
        })
    },
    [configured, handleCredentialResponse, mode],
  )

  // Re-initialize if handleCredentialResponse changes (remember/nextPath changed)
  useEffect(() => {
    if (!initializedRef.current || !containerRef.current || !configured) return
    window.google?.accounts?.id?.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })
  }, [handleCredentialResponse, configured])

  return { buttonRef, ready, loading, configured }
}
