'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'goodswap-settings'

interface SwapSettings {
  slippage: number
  deadline: number
}

const DEFAULTS: SwapSettings = {
  slippage: 0.5,
  deadline: 30,
}

function loadSettings(): SwapSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      slippage: typeof parsed.slippage === 'number' ? parsed.slippage : DEFAULTS.slippage,
      deadline: typeof parsed.deadline === 'number' ? parsed.deadline : DEFAULTS.deadline,
    }
  } catch {
    return DEFAULTS
  }
}

function clampSlippage(val: number): number {
  return Math.max(0, Math.min(50, val))
}

export function useSwapSettings() {
  const [settings, setSettings] = useState<SwapSettings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch { /* quota exceeded or SSR */ }
  }, [settings])

  const setSlippage = useCallback((val: number) => {
    setSettings(prev => ({ ...prev, slippage: clampSlippage(val) }))
  }, [])

  const setDeadline = useCallback((val: number) => {
    setSettings(prev => ({ ...prev, deadline: Math.max(1, Math.min(180, val)) }))
  }, [])

  return {
    slippage: settings.slippage,
    deadline: settings.deadline,
    setSlippage,
    setDeadline,
  }
}
