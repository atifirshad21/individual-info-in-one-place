import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Users, ExternalLink } from "lucide-react";

interface ProfileCardProps {
  name: string;
  headline?: string;
  currentRole?: string;
  location?: string;
  profileImageUrl?: string;
  connectionCount?: number;
  industry?: string;
  linkedinUrl?: string;
}

export default function ProfileCard({
  name, headline, currentRole, location, profileImageUrl, connectionCount, industry, linkedinUrl,
}: ProfileCardProps) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={profileImageUrl} alt={name} />
          <AvatarFallback className="text-lg font-semibold bg-zinc-100 dark:bg-zinc-800">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold truncate">{name}</h2>
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-500 transition-colors shrink-0">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {headline && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{headline}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-zinc-500">
            {currentRole && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{currentRole}</span>}
            {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
            {connectionCount && connectionCount > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{connectionCount.toLocaleString()}+</span>}
          </div>
          {industry && <Badge variant="secondary" className="mt-2">{industry}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
