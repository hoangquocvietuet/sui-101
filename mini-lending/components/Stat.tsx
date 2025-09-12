import { cn } from "@/lib/utils"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StatProps {
  title: string
  value: string
  tooltip?: string
  className?: string
}

export function Stat({ title, value, tooltip, className }: StatProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
