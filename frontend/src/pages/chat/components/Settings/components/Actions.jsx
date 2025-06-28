import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2 } from "lucide-react";

const SettingsActions = ({ logout, deleteAccount }) => {
  return (
    <div className="w-full max-w-[500px] mx-auto px-6 pt-6 pb-8 z-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 🔓 Logout */}  
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-center gap-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your session. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                onClick={logout}
              >
                Confirm Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 🗑️ Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-center gap-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 size={18} />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. All your data will be lost permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white rounded-md"
                onClick={deleteAccount}
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsActions;
