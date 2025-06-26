import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const MediaControlButton = ({ onClick, icon, label, className = "", variant = "outline" }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant={variant}
          size="icon"
          className={`bg-zinc-800 ${className}`}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};

export default MediaControlButton;
