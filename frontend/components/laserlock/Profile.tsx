import { GlassCard } from "./GlassCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Camera, Mail, User, Calendar, MapPin, Link as LinkIcon, Flame, Trophy, Target } from "lucide-react";
import { Separator } from "../ui/separator";

interface ProfileProps {
  userName: string;
  userEmail: string;
}

export function Profile({ userName, userEmail }: ProfileProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <GlassCard glow className="relative overflow-hidden">
        {/* Cover Background */}
        <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary via-accent to-secondary opacity-20" />
        
        <div className="relative pt-20 pb-6">
          {/* Avatar */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-background shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-4xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h2 className="text-3xl text-primary">{userName}</h2>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                  Level 28
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">{userEmail}</p>
              <p className="text-sm text-foreground/80 max-w-2xl">
                Focused on building better habits and mastering deep work. ADHD warrior on a mission to unlock peak productivity 🎯
              </p>
            </div>

            <Button variant="outline" className="border-primary text-primary">
              Edit Profile
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <p className="text-2xl text-primary">4</p>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <p className="text-2xl text-secondary">23</p>
              </div>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-green-500" />
                <p className="text-2xl text-accent">156h</p>
              </div>
              <p className="text-xs text-muted-foreground">Total Focus</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/10">
              <p className="text-2xl text-primary mb-1">2,450</p>
              <p className="text-xs text-muted-foreground">XP Points</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <GlassCard>
          <h3 className="mb-4 text-primary flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                defaultValue={userName}
                className="bg-input-background mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue={userEmail}
                  className="bg-input-background pl-10"
                  disabled
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  className="bg-input-background pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative mt-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  className="bg-input-background pl-10"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Bio & Preferences */}
        <GlassCard>
          <h3 className="mb-4 text-secondary">About & Goals</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your focus journey..."
                className="bg-input-background mt-1 min-h-32"
                defaultValue="Focused on building better habits and mastering deep work. ADHD warrior on a mission to unlock peak productivity 🎯"
              />
            </div>
            <div>
              <Label htmlFor="joinDate">Member Since</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="joinDate"
                  defaultValue="October 2024"
                  className="bg-input-background pl-10"
                  disabled
                />
              </div>
            </div>
            <div>
              <Label>Focus Goals</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="border-primary text-primary">
                  2h daily focus
                </Badge>
                <Badge variant="outline" className="border-secondary text-secondary">
                  30-day streak
                </Badge>
                <Badge variant="outline" className="border-accent text-accent">
                  Level 30
                </Badge>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Preferences */}
      <GlassCard>
        <h3 className="mb-4 text-accent">Focus Preferences</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Preferred Session Length</Label>
            <div className="flex gap-2">
              <Badge className="bg-primary/20 text-primary cursor-pointer hover:bg-primary/30">25 min</Badge>
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">45 min</Badge>
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">90 min</Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Best Focus Time</Label>
            <div className="flex gap-2">
              <Badge className="bg-secondary/20 text-secondary cursor-pointer hover:bg-secondary/30">Morning</Badge>
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">Afternoon</Badge>
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">Night</Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Work Environment</Label>
            <div className="flex gap-2">
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">Silent</Badge>
              <Badge className="bg-accent/20 text-accent cursor-pointer hover:bg-accent/30">Music</Badge>
              <Badge className="bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30">Ambient</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
