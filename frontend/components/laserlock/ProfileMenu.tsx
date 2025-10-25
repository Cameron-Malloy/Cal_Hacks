import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { User, Settings, LogOut, Award, TrendingUp } from "lucide-react";
import { Badge } from "../ui/badge";

interface ProfileMenuProps {
  userName: string;
  userEmail: string;
  onNavigateToProfile: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToStats: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export function ProfileMenu({ 
  userName, 
  userEmail, 
  onNavigateToProfile,
  onNavigateToAchievements,
  onNavigateToStats,
  onNavigateToSettings, 
  onLogout 
}: ProfileMenuProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative group">
          <Avatar className="w-10 h-10 border-2 border-primary/30 group-hover:border-primary transition-all cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-primary/20 backdrop-blur-xl">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Level 28</span>
            <Badge variant="outline" className="border-secondary text-secondary text-xs">
              2,450 XP
            </Badge>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary w-3/4" />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="cursor-pointer" onClick={onNavigateToProfile}>
          <User className="mr-2 h-4 w-4 text-primary" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onNavigateToAchievements}>
          <Award className="mr-2 h-4 w-4 text-secondary" />
          <span>Achievements</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onNavigateToStats}>
          <TrendingUp className="mr-2 h-4 w-4 text-accent" />
          <span>My Stats</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onNavigateToSettings}>
          <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
