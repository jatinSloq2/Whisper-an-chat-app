import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const MediaControlButton = ({ 
  onClick, 
  icon, 
  label, 
  className = "", 
  variant = "outline",
  disabled = false 
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          disabled={disabled}
          variant={variant}
          size="icon"
          className={`
            relative
            rounded-full
            border-2
            transition-all 
            duration-200
            hover:scale-110
            active:scale-95
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:hover:scale-100
            shadow-lg
            ${className}
          `}
          aria-label={label}
        >
          <span className="relative z-10 flex items-center justify-center">
            {icon}
          </span>
          
          {/* Ripple effect on hover */}
          <span className="absolute inset-0 rounded-full bg-white/0 hover:bg-white/10 transition-colors duration-200" />
        </Button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-gray-900 text-white border-gray-700 px-3 py-1.5 text-sm font-medium"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export default MediaControlButton;