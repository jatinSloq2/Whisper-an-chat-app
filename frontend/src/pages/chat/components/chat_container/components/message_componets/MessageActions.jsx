import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Share2 } from "lucide-react";

const MessageActions = ({ message, onCopy, onDeleteForMe, onDeleteForBoth, onForward }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="w-full h-full cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onCopy(message)}
        >
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onDeleteForMe(message)}
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete for me
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onDeleteForBoth(message)}
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-700" /> Delete for both
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onForward(message)}
        >
          <Share2 className="mr-2 h-4 w-4" /> Forward
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default MessageActions;
