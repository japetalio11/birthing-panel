// /components/ui/sonner.tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-sans" // Added font-sans class to apply Inter font
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "fontFamily": "var(--font-sans)", // Ensure font-family uses Inter via --font-sans
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }