"use client"
import { useEffect, useState } from "react"

export function RainbowTextEffect({ fontSize = 10, text = "make a wish", className = "" }: { text?: string; className?: string; fontSize?: number }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const desktopTextShadow = `
    2px 10px #8B5CF6, 2px 12px #000, 
    4px 20px #7C3AED, 4px 22px #000, 
    6px 30px #EA580C, 6px 32px #000, 
    8px 40px #F97316, 8px 42px #000
  `
  const mobileStyles = {
    background: "linear-gradient(to bottom, #8B5CF6, #F97316)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    lineHeight: "130%",
  }
  const desktopStyles = {
    color: "white",
    WebkitTextStroke: "1px #000",
    textShadow: desktopTextShadow,
    lineHeight: "100%",
  }
  const baseStyles = {
    fontFamily: "'Open Sans', sans-serif",
    fontStyle: "italic" as const,
    fontSize: isMobile ? "15vw" : `${fontSize}vw`,
    fontWeight: 900,
    textTransform: "lowercase" as const,
    margin: 0,
    padding: 0,
  }

  return (
    <div className={`text-center pointer-events-none select-none ${className}`}>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@1,800&display=swap" rel="stylesheet" />
      <p style={{ ...baseStyles, ...(isMobile ? mobileStyles : desktopStyles) }}>{text}</p>
    </div>
  )
}