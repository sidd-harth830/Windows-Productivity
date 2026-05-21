import * as React from "react"
import { cn } from "./components/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm text-[var(--text)] shadow-inner file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text)] placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgb(var(--a1))] focus-visible:border-[rgb(var(--a1))] disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
export { Input }