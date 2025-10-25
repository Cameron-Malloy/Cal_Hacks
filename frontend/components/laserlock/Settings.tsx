import { GlassCard } from "./GlassCard";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Eye, Bell, Palette, Shield, Smartphone, Database, LogOut } from "lucide-react";
import { Badge } from "../ui/badge";

const productiveApps = ["Figma", "VS Code", "Notion", "Slack", "Linear"];
const unproductiveApps = ["Twitter", "Instagram", "YouTube", "TikTok", "Reddit"];

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Account */}
      <GlassCard glow>
        <h3 className="mb-4 text-primary">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
              AL
            </div>
            <div className="flex-1">
              <p className="text-foreground">Alex Rivera</p>
              <p className="text-sm text-muted-foreground">alex.rivera@email.com</p>
            </div>
            <Button variant="outline" size="sm">Edit Profile</Button>
          </div>
        </div>
      </GlassCard>

      {/* Feature Toggles */}
      <GlassCard>
        <h3 className="mb-4 text-secondary">Features & Tracking</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <Label>Eye Tracking</Label>
                <p className="text-xs text-muted-foreground">Monitor gaze patterns for focus insights</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-secondary" />
              <div>
                <Label>Focus Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified when distracted</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-accent" />
              <div>
                <Label>Phone Integration</Label>
                <p className="text-xs text-muted-foreground">Block distracting apps during sessions</p>
              </div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <Label>Privacy Mode</Label>
                <p className="text-xs text-muted-foreground">Don't track app names, only focus time</p>
              </div>
            </div>
            <Switch />
          </div>
        </div>
      </GlassCard>

      {/* Theme */}
      <GlassCard>
        <h3 className="mb-4 text-accent flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary text-center cursor-pointer">
            <div className="w-full h-12 rounded-lg bg-gradient-to-br from-primary to-secondary mb-2" />
            <p className="text-xs">Cyber Purple</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border-2 border-transparent hover:border-secondary text-center cursor-pointer">
            <div className="w-full h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 mb-2" />
            <p className="text-xs">Ocean Blue</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border-2 border-transparent hover:border-accent text-center cursor-pointer">
            <div className="w-full h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 mb-2" />
            <p className="text-xs">Sunset Glow</p>
          </div>
        </div>
      </GlassCard>

      {/* App Keywords */}
      <GlassCard glow>
        <h3 className="mb-4 text-primary">Productivity Keywords</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Define which apps count as productive or unproductive for accurate tracking.
        </p>

        <div className="space-y-6">
          <div>
            <Label className="text-secondary mb-2 block">Productive Apps</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {productiveApps.map((app) => (
                <Badge key={app} variant="outline" className="border-secondary text-secondary">
                  {app} ×
                </Badge>
              ))}
            </div>
            <Input placeholder="Add productive app..." className="bg-input-background" />
          </div>

          <Separator className="bg-border" />

          <div>
            <Label className="text-destructive mb-2 block">Unproductive Apps</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {unproductiveApps.map((app) => (
                <Badge key={app} variant="outline" className="border-destructive text-destructive">
                  {app} ×
                </Badge>
              ))}
            </div>
            <Input placeholder="Add unproductive app..." className="bg-input-background" />
          </div>
        </div>
      </GlassCard>

      {/* Data & Sync */}
      <GlassCard>
        <h3 className="mb-4 text-secondary flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data & Sync
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <div>
              <p className="text-sm">Cloud Sync</p>
              <p className="text-xs text-muted-foreground">Last synced: 2 minutes ago</p>
            </div>
            <Badge className="bg-secondary/20 text-secondary">Active</Badge>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">Export Data</Button>
            <Button variant="outline" className="flex-1 border-destructive text-destructive">
              Clear History
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Logout */}
      <GlassCard>
        <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </GlassCard>
    </div>
  );
}
