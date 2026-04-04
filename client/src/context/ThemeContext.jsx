import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('coderhub_theme')
    return saved ? saved === 'dark' : true // default dark
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('light-mode')
      root.classList.add('dark-mode')
    } else {
      root.classList.remove('dark-mode')
      root.classList.add('light-mode')
    }
    localStorage.setItem('coderhub_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
