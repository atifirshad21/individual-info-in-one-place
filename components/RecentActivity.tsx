import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink } from "lucide-react";

interface ActivityItem {
  title: string;
  source: string;
  date?: string;
  snippet?: string;
  link?: string;
  type: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 8).map((item, i) => {
            const Wrapper = item.link ? "a" : "div";
            const wrapperProps = item.link
              ? { href: item.link, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <Wrapper key={i} {...wrapperProps} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    {item.link && <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-500 shrink-0 transition-colors" />}
                  </div>
                  {item.snippet && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.snippet}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    {item.date && <span className="text-xs text-zinc-400">{item.date}</span>}
                    <span className="text-xs text-zinc-400">{item.source}</span>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
